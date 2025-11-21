const db = require("../config/db");
const { getServiceDetailsByNames } = require("../services/serviceServices");
const { generateOrderCode } = require("../services/orderServices");

const createWalkInOrder = async (req, res) => {
  const {
    guest_name,
    guest_phone_number,
    load,
    promo,
    main_services,
    supplies,
    payment_type,
    payment_status,
    total_amount,
    paid_amount,
  } = req.body;

  // Validate required fields
  if (!guest_name) {
    return res.status(400).json({ error: "guest_name is required" });
  }

  const normalizedPaymentStatus =
    (payment_status && payment_status.toString().trim()) || "Unpaid";
  const lowerPaymentStatus = normalizedPaymentStatus.toLowerCase();
  const isPartial =
    lowerPaymentStatus === "partial" || lowerPaymentStatus === "partially paid";
  const cleanPaidAmount = Number(paid_amount) || 0;

  if (isPartial && cleanPaidAmount <= 0) {
    return res.status(400).json({
      error:
        "paid_amount is required and must be greater than 0 when payment_status is Partial",
    });
  }

  if (!isPartial && cleanPaidAmount < 0) {
    return res.status(400).json({ error: "paid_amount cannot be negative" });
  }

  try {
    const orderCode = await generateOrderCode();

    db.beginTransaction((err) => {
      if (err) {
        return res.status(500).json({ error: "Database transaction error" });
      }

      const orderQuery =
        "INSERT INTO orders (order_code, guest_name, guest_phone, total_amount, paid_amount, payment_type, payment_status, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'Walk-in', NOW())";

      db.query(
        orderQuery,
        [
          orderCode,
          guest_name,
          guest_phone_number || null,
          total_amount || 0,
          cleanPaidAmount,
          payment_type || "Cash",
          normalizedPaymentStatus,
        ],
        async (err, result) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({
                error: "Database insert order error",
                message: err.message,
              });
            });
          }
          const orderId = result.insertId;

          try {
            // Insert services/promo
            const serviceIds = promo ? [promo] : main_services;
            if (serviceIds && serviceIds.length > 0) {
              const serviceDetails = await getServiceDetailsByNames(
                serviceIds.map((s) =>
                  typeof s === "string" ? s : s.service_name
                )
              );

              if (serviceDetails.length > 0) {
                const insertServiceSql =
                  "INSERT INTO order_details (order_id, service_id, quantity, unit_price) VALUES ?";
                const serviceValues = serviceDetails.map((service) => [
                  orderId,
                  service.service_id,
                  load || 1,
                  service.price,
                ]);

                // ✅ Wrap in Promise
                await new Promise((resolve, reject) => {
                  db.query(insertServiceSql, [serviceValues], (e2) => {
                    if (e2) return reject(e2);
                    resolve();
                  });
                });
              }
            }

            // Insert supplies added by customer
            if (supplies && supplies.length > 0) {
              const suppliesWithQty = supplies.filter((s) => s.quantity > 0);

              if (suppliesWithQty.length > 0) {
                const supplyDetails = await getServiceDetailsByNames(
                  suppliesWithQty.map((s) => s.name)
                );

                if (supplyDetails.length > 0) {
                  const insertSupplySql =
                    "INSERT INTO order_details (order_id, service_id, quantity, unit_price) VALUES ?";
                  const supplyValues = supplyDetails.map((service) => {
                    const matchingSupply = suppliesWithQty.find(
                      (s) => s.name === service.service_name
                    );
                    return [
                      orderId,
                      service.service_id,
                      matchingSupply?.quantity || 1,
                      service.price,
                    ];
                  });

                  // ✅ Wrap in Promise
                  await new Promise((resolve, reject) => {
                    db.query(insertSupplySql, [supplyValues], (e3) => {
                      if (e3) return reject(e3);
                      resolve();
                    });
                  });
                }
              }
            }

            // ✅ Wrap commit in Promise
            await new Promise((resolve, reject) => {
              db.commit((err) => {
                if (err) return reject(err);
                resolve();
              });
            });

            res.status(201).json({
              message: "Walk-in order created successfully",
              orderId,
              orderCode,
            });
          } catch (e) {
            return db.rollback(() => {
              res.status(500).json({
                error: "Database insert details error",
                message: e.message,
              });
            });
          }
        }
      );
    });
  } catch (e) {
    return res.status(500).json({ error: "Server error: " + e.message });
  }
};

const getAllOrders = (req, res) => {
  let {
    status,
    notStatus,
    payment_status,
    source, // 'walk-in' or 'Booking'
    from,
    to,
    page = 1,
    limit = 20,
    order = "DESC",
    search,
  } = req.query;

  const safeOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC";
  const offset = (Number(page) - 1) * Number(limit);

  const whereParts = [];
  const params = [];

  // Clean input
  const clean = (v) => v && v.replace(/^['"]+|['"]+$/g, "").trim();

  status = clean(status);
  notStatus = clean(notStatus);
  payment_status = clean(payment_status);
  source = clean(source);
  search = clean(search);

  // Filters
  if (status && status.toLowerCase() !== "all") {
    whereParts.push("LOWER(o.status) = LOWER(?)");
    params.push(status);
  } else if (notStatus) {
    const excludedStatuses = notStatus
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (excludedStatuses.length === 1) {
      whereParts.push("LOWER(o.status) <> LOWER(?)");
      params.push(excludedStatuses[0]);
    } else if (excludedStatuses.length > 1) {
      const placeholders = excludedStatuses.map(() => "?").join(", ");
      whereParts.push(`LOWER(o.status) NOT IN (${placeholders})`);
      params.push(...excludedStatuses);
    }
  }

  if (payment_status && payment_status.toLowerCase() !== "all") {
    whereParts.push("LOWER(o.payment_status) = LOWER(?)");
    params.push(payment_status);
  }

  if (source && source.toLowerCase() !== "all") {
    whereParts.push("o.source = ?");
    params.push(source === "walk-in" ? "Walk-in" : "Booking");
  }

  if (from) {
    whereParts.push("DATE(o.created_at) >= ?");
    params.push(from);
  }
  if (to) {
    whereParts.push("DATE(o.created_at) <= ?");
    params.push(to);
  }

  // Search across order code, customer name/phone and guest name/phone
  if (search) {
    const like = `%${search.toLowerCase()}%`;
    whereParts.push(
      `(LOWER(o.order_code) LIKE ? OR LOWER(COALESCE(c.name, '')) LIKE ? OR LOWER(COALESCE(c.phone_number, '')) LIKE ? OR LOWER(COALESCE(o.guest_name, '')) LIKE ? OR LOWER(COALESCE(o.guest_phone, '')) LIKE ?)`
    );
    params.push(like, like, like, like, like);
  }

  const whereClause = whereParts.length
    ? "WHERE " + whereParts.join(" AND ")
    : "";

  // Count total (include customers join so search on customer fields works)
  const countSql = `SELECT COUNT(*) as total FROM orders o LEFT JOIN customers c ON o.customer_id = c.customer_id ${whereClause}`;

  db.query(countSql, params, (countErr, countResult) => {
    if (countErr) {
      return res.status(500).json({ error: "Database error (count)" });
    }

    const totalRecords = countResult[0]?.total || 0;

    // Fetch orders
    const ordersSql = `
      SELECT 
        o.order_id,
        o.order_code,
        o.booking_id,
        o.guest_name,
        o.guest_phone,
        COALESCE(c.name, o.guest_name) AS customer_name,
        COALESCE(c.phone_number, o.guest_phone) AS customer_phone,
        o.total_amount,
        o.paid_amount,
        o.payment_type,
        o.payment_status,
        o.source,
        o.status,
        o.created_at
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      ${whereClause}
      ORDER BY o.order_id ${safeOrder}
      LIMIT ? OFFSET ?
    `;

    db.query(ordersSql, [...params, Number(limit), offset], (err, orders) => {
      if (err) {
        return res.status(500).json({ error: "Database error (orders)" });
      }
      if (!orders.length) {
        return res.status(200).json({
          page: Number(page),
          limit: Number(limit),
          total: totalRecords,
          totalPages: Math.ceil(totalRecords / Number(limit)),
          data: [],
        });
      }

      const orderIds = orders.map((o) => o.order_id);
      const placeholders = orderIds.map(() => "?").join(", ");

      const detailsSql = `
          SELECT 
            od.order_id,
            od.service_id,
            od.quantity,
            od.unit_price,
            s.service_name,
            s.service_type
          FROM order_details od
          JOIN services s ON s.service_id = od.service_id
          WHERE od.order_id IN (${placeholders})
          ORDER BY od.order_id, od.service_id
        `;

      db.query(detailsSql, orderIds, (dErr, details) => {
        if (dErr) {
          return res.status(500).json({ error: "Database error (details)" });
        }

        const byId = new Map();
        for (const o of orders) {
          byId.set(o.order_id, {
            ...o,
            details: [],
            calculated_total: 0,
          });
        }

        for (const row of details) {
          const lineTotal = Number(row.unit_price) * Number(row.quantity);
          const bucket = byId.get(row.order_id);
          if (bucket) {
            bucket.details.push({
              service_id: row.service_id,
              service_name: row.service_name,
              service_type: row.service_type,
              quantity: Number(row.quantity),
              unit_price: Number(row.unit_price),
              line_total: lineTotal,
            });
            bucket.calculated_total += lineTotal;
          }
        }

        return res.status(200).json({
          page: Number(page),
          limit: Number(limit),
          total: totalRecords,
          totalPages: Math.ceil(totalRecords / Number(limit)),
          data: Array.from(byId.values()),
        });
      });
    });
  });
};

const updateOrderPaymentStatus = (req, res) => {
  const orderId = req.params.orderId;
  const { payment_status, paid_amount } = req.body || {};

  if (!orderId) {
    return res.status(400).json({ error: "orderId is required" });
  }
  if (!payment_status) {
    return res.status(400).json({ error: "payment_status is required" });
  }

  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: "Database transaction error" });
    }

    const selectSql =
      "SELECT total_amount FROM orders WHERE order_id = ? FOR UPDATE";
    db.query(selectSql, [orderId], (selectErr, rows) => {
      if (selectErr) {
        return db.rollback(() => {
          res.status(500).json({
            error: "Database select error",
            message: selectErr.message,
          });
        });
      }

      if (!rows || rows.length === 0) {
        return db.rollback(() => {
          res.status(404).json({ error: "Order not found" });
        });
      }

      const totalAmount = Number(rows[0].total_amount) || 0;
      const normalized = payment_status.toString().trim();
      const lower = normalized.toLowerCase();

      let dbPaymentStatus;
      let newPaidAmount = 0;

      if (lower === "paid") {
        dbPaymentStatus = "Paid";
        newPaidAmount = totalAmount;
      } else if (lower === "unpaid") {
        dbPaymentStatus = "Unpaid";
        newPaidAmount = 0;
      } else if (lower === "partial" || lower === "partially paid") {
        const numericPaid = Number(paid_amount);
        if (!numericPaid || numericPaid <= 0) {
          return db.rollback(() => {
            res.status(400).json({
              error: "paid_amount must be greater than 0 for partial payments",
            });
          });
        }
        if (numericPaid >= totalAmount) {
          return db.rollback(() => {
            res.status(400).json({
              error: "Partial payment must be less than the total amount",
            });
          });
        }
        dbPaymentStatus = "Partial";
        newPaidAmount = numericPaid;
      } else {
        return db.rollback(() => {
          res.status(400).json({
            error:
              "Invalid payment_status. Use Paid, Unpaid, or Partial / Partially Paid.",
          });
        });
      }

      const updateSql =
        "UPDATE orders SET payment_status = ?, paid_amount = ?, updated_at = NOW() WHERE order_id = ?";
      db.query(
        updateSql,
        [dbPaymentStatus, newPaidAmount, orderId],
        (updateErr) => {
          if (updateErr) {
            return db.rollback(() => {
              res.status(500).json({
                error: "Database update error",
                message: updateErr.message,
              });
            });
          }

          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => {
                res.status(500).json({
                  error: "Database commit error",
                  message: commitErr.message,
                });
              });
            }

            return res.status(200).json({
              message: "Payment status updated successfully",
              payment_status: dbPaymentStatus,
              paid_amount: newPaidAmount,
            });
          });
        }
      );
    });
  });
};

const updateOrderStatus = (req, res) => {
  const orderId = req.params.orderId;
  const { status } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: "orderId is required" });
  }
  if (!status) {
    return res.status(400).json({ error: "status is required" });
  }
  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: "Database transaction error" });
    }

    // First, fetch current status + payment_status so we can enforce rules
    const selectSql =
      "SELECT status, payment_status FROM orders WHERE order_id = ? FOR UPDATE";
    db.query(selectSql, [orderId], (selectErr, rows) => {
      if (selectErr) {
        return db.rollback(() => {
          res.status(500).json({
            error: "Database select error",
            message: selectErr.message,
          });
        });
      }

      if (!rows || rows.length === 0) {
        return db.rollback(() => {
          res.status(404).json({ error: "Order not found" });
        });
      }

      const currentStatus = String(rows[0].status || "").toLowerCase();
      const currentPaymentStatus = String(
        rows[0].payment_status || ""
      ).toLowerCase();
      const requestedStatus = String(status || "").toLowerCase();

      // Business rule:
      // Do NOT allow moving to "completed" if current status is "ready"
      // and payment_status is "unpaid" or "partially paid"
      if (
        requestedStatus === "completed" &&
        currentStatus === "ready" &&
        (currentPaymentStatus === "unpaid" ||
          currentPaymentStatus === "partial")
      ) {
        return db.rollback(() => {
          res.status(400).json({
            error: "Payment must be fully paid to mark as completed",
          });
        });
      }

      if (requestedStatus === "cancelled" && currentStatus !== "stand by") {
        return db.rollback(() => {
          res.status(400).json({
            error: "Only orders in Stand By can be cancelled",
          });
        });
      }

      const updateSql = "UPDATE orders SET status = ? WHERE order_id = ?";
      db.query(updateSql, [status, orderId], (updateErr) => {
        if (updateErr) {
          return db.rollback(() => {
            res.status(500).json({
              error: "Database update error",
              message: updateErr.message,
            });
          });
        }

        const isProcessing = requestedStatus === "processing";
        const isCompleted = requestedStatus === "completed";
        const isCancelled = requestedStatus === "cancelled";

        if (isProcessing) {
          const getOrderSuppliesSql = `SELECT
  service_id,
  inventory_item_id,
  SUM(required_qty) AS total_required_qty
FROM (
  (
    SELECT 
      od.order_id,
      s.service_id,
      'add_on_supply' AS source_type,
      od.quantity AS required_qty,
      i.item_id AS inventory_item_id
    FROM order_details od
    JOIN services s ON s.service_id = od.service_id
    JOIN inventory i ON i.service_id = s.service_id
    WHERE od.order_id = ?
      AND s.service_type = 'add_on_supply'
  )
  UNION ALL
  (
    SELECT 
      od.order_id,
      inv.service_id,
      'bundle_package' AS source_type,
      od.quantity * pi.quantity_used AS required_qty,
      inv.item_id AS inventory_item_id
    FROM order_details od
    JOIN services bundle ON bundle.service_id = od.service_id
    JOIN package_includes pi ON pi.bundle_service_id = bundle.service_id
    JOIN inventory inv ON inv.item_id = pi.inventory_item_id
    WHERE od.order_id = ?
      AND bundle.service_type = 'bundle_package'
  )
) AS all_supplies
GROUP BY service_id, inventory_item_id;`;
          db.query(
            getOrderSuppliesSql,
            [orderId, orderId],
            (supplyErr, supplies) => {
              if (supplyErr) {
                return db.rollback(() => {
                  res.status(500).json({
                    error: "Database supply query error",
                    message: supplyErr.message,
                  });
                });
              }

              const updateInventoryPromises = supplies.map((supply) => {
                return new Promise((resolve, reject) => {
                  const updateInventorySql = `UPDATE inventory
                  SET quantity = quantity - ?
                  WHERE item_id = ?`;

                  db.query(
                    updateInventorySql,
                    [supply.total_required_qty, supply.inventory_item_id],
                    (invErr) => {
                      if (invErr) return reject(invErr);
                      resolve();
                    }
                  );
                });
              });

              Promise.all(updateInventoryPromises)
                .then(() => {
                  // All inventory updates succeeded
                  db.commit((commitErr) => {
                    if (commitErr) {
                      return db.rollback(() => {
                        res.status(500).json({
                          error: "Database commit error",
                          message: commitErr.message,
                        });
                      });
                    }
                    return res
                      .status(200)
                      .json({ message: "Order status updated successfully" });
                  });
                })
                .catch((invErr) => {
                  return db.rollback(() => {
                    res.status(500).json({
                      error: "Database inventory update error",
                      message: invErr.message,
                    });
                  });
                });
            }
          );
          return; // we'll respond inside the inventory promise chain
        }

        if (isCompleted) {
          const updateOrderSql =
            "UPDATE orders SET completion_date = NOW() WHERE order_id = ?";
          db.query(updateOrderSql, [orderId], (updateErr) => {
            if (updateErr) {
              return db.rollback(() => {
                res.status(500).json({
                  error: "Database update error",
                  message: updateErr.message,
                });
              });
            }

            db.commit((commitErr) => {
              if (commitErr) {
                return db.rollback(() => {
                  res.status(500).json({
                    error: "Database commit error",
                    message: commitErr.message,
                  });
                });
              }
              return res
                .status(200)
                .json({ message: "Order marked as completed" });
            });
          });
          return;
        }

        if (isCancelled) {
          const updateOrderPaymentStatusSql =
            "UPDATE orders SET payment_status = 'Refunded' WHERE order_id = ? AND paid_amount != 0";
          db.query(updateOrderPaymentStatusSql, [orderId], (updateErr) => {
            if (updateErr) {
              return db.rollback(() => {
                res.status(500).json({
                  error: "Database update error",
                  message: updateErr.message,
                });
              });
            }

            db.commit((commitErr) => {
              if (commitErr) {
                return db.rollback(() => {
                  res.status(500).json({
                    error: "Database commit error",
                    message: commitErr.message,
                  });
                });
              }

              return res
                .status(200)
                .json({ message: "Order cancelled and refunded" });
            });
          });
          return;
        }

        // just commit the status change basically for ready status.
        db.commit((commitErr) => {
          if (commitErr) {
            return db.rollback(() => {
              res.status(500).json({
                error: "Database commit error",
                message: commitErr.message,
              });
            });
          }
          return res
            .status(200)
            .json({ message: "Order status updated successfully" });
        });
      });
    });
  });
};

const editOrder = (req, res) => {
  const orderId = req.params.orderId;
  const { updatedDetails } = req.body; // Array of { service_id, quantity, unit_price, ... }

  if (!orderId) {
    return res.status(400).json({ error: "orderId is required" });
  }
  if (!updatedDetails || !Array.isArray(updatedDetails)) {
    return res
      .status(400)
      .json({ error: "updatedDetails is required and must be an array" });
  }

  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: "Database transaction error" });
    }

    // Fetch current order
    const selectSql =
      "SELECT status, payment_status, total_amount, paid_amount FROM orders WHERE order_id = ? FOR UPDATE";
    db.query(selectSql, [orderId], (selectErr, rows) => {
      if (selectErr) {
        return db.rollback(() => {
          res.status(500).json({
            error: "Database select error",
            message: selectErr.message,
          });
        });
      }

      if (!rows || rows.length === 0) {
        return db.rollback(() => {
          res.status(404).json({ error: "Order not found" });
        });
      }

      const order = rows[0];
      // Allow case-insensitive comparison for status check
      if (String(order.status || "").toLowerCase() !== "stand by") {
        return db.rollback(() => {
          res
            .status(400)
            .json({ error: "Can only edit orders in Stand By status" });
        });
      }

      // Recalculate total
      const newTotal = updatedDetails.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
        0
      );

      // Update payment status
      const originalTotal = Number(order.total_amount);
      const paidAmount = Number(order.paid_amount);
      let newPaymentStatus = order.payment_status;
      const currentPaymentLower = String(
        order.payment_status || ""
      ).toLowerCase();
      if (newTotal > originalTotal && currentPaymentLower === "paid") {
        newPaymentStatus = "Partial";
      } else if (newTotal <= paidAmount) {
        newPaymentStatus = "Paid";
      } else if (paidAmount > 0 && paidAmount < newTotal) {
        newPaymentStatus = "Partial";
      } else {
        newPaymentStatus = "Unpaid";
      }

      // Only update details for services present in updatedDetails
      const serviceIds = updatedDetails
        .map((item) => item.service_id)
        .filter(Boolean);
      if (serviceIds.length === 0) {
        // Nothing to update, just update order total and payment status
        const updateOrderSql =
          "UPDATE orders SET total_amount = ?, payment_status = ? WHERE order_id = ?";
        db.query(
          updateOrderSql,
          [newTotal, newPaymentStatus, orderId],
          (updateErr) => {
            if (updateErr) {
              return db.rollback(() => {
                res.status(500).json({
                  error: "Database update error",
                  message: updateErr.message,
                });
              });
            }
            db.commit((commitErr) => {
              if (commitErr) {
                return db.rollback(() => {
                  res.status(500).json({
                    error: "Database commit error",
                    message: commitErr.message,
                  });
                });
              }
              res.status(200).json({ message: "Order updated successfully" });
            });
          }
        );
        return;
      }
      // Delete only details for services being updated
      const deleteDetailsSql = `DELETE FROM order_details WHERE order_id = ? AND service_id IN (${serviceIds
        .map(() => "?")
        .join(",")})`;
      db.query(deleteDetailsSql, [orderId, ...serviceIds], (deleteErr) => {
        if (deleteErr) {
          return db.rollback(() => {
            res.status(500).json({
              error: "Database delete error",
              message: deleteErr.message,
            });
          });
        }
        // Only insert non-zero quantity details
        const values = updatedDetails
          .filter((item) => Number(item.quantity) > 0)
          .map((item) => [
            orderId,
            item.service_id,
            item.quantity,
            item.unit_price,
          ]);
        if (values.length === 0) {
          // No new details to insert, just update order
          const updateOrderSql =
            "UPDATE orders SET total_amount = ?, payment_status = ? WHERE order_id = ?";
          db.query(
            updateOrderSql,
            [newTotal, newPaymentStatus, orderId],
            (updateErr) => {
              if (updateErr) {
                return db.rollback(() => {
                  res.status(500).json({
                    error: "Database update error",
                    message: updateErr.message,
                  });
                });
              }
              db.commit((commitErr) => {
                if (commitErr) {
                  return db.rollback(() => {
                    res.status(500).json({
                      error: "Database commit error",
                      message: commitErr.message,
                    });
                  });
                }
                res.status(200).json({ message: "Order updated successfully" });
              });
            }
          );
          return;
        }
        const insertDetailsSql =
          "INSERT INTO order_details (order_id, service_id, quantity, unit_price) VALUES ?";
        db.query(insertDetailsSql, [values], (insertErr) => {
          if (insertErr) {
            return db.rollback(() => {
              res.status(500).json({
                error: "Database insert error",
                message: insertErr.message,
              });
            });
          }
          // Update order total and payment status
          const updateOrderSql =
            "UPDATE orders SET total_amount = ?, payment_status = ? WHERE order_id = ?";
          db.query(
            updateOrderSql,
            [newTotal, newPaymentStatus, orderId],
            (updateErr) => {
              if (updateErr) {
                return db.rollback(() => {
                  res.status(500).json({
                    error: "Database update error",
                    message: updateErr.message,
                  });
                });
              }
              db.commit((commitErr) => {
                if (commitErr) {
                  return db.rollback(() => {
                    res.status(500).json({
                      error: "Database commit error",
                      message: commitErr.message,
                    });
                  });
                }
                res.status(200).json({ message: "Order updated successfully" });
              });
            }
          );
        });
      });
    });
  });
};

module.exports = {
  createWalkInOrder,
  getAllOrders,
  updateOrderStatus,
  updateOrderPaymentStatus,
  editOrder,
};
