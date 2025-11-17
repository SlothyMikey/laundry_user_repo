const db = require("../config/db");
const { findOrCreateCustomerByPhone } = require("../services/customerService");
const { getServiceDetailsByNames } = require("../services/serviceServices");
const {
  generateOrderCode,
  calculateBookingTotal,
} = require("../services/bookingServices");

const addBooking = async (req, res) => {
  const {
    name,
    phone_number,
    email,
    address,
    load,
    promo,
    main_services,
    supplies,
    pickup_date,
    payment_type,
    special_instruction,
  } = req.body;

  try {
    const customer = await findOrCreateCustomerByPhone({
      name,
      phone_number,
      email,
      address,
    });

    db.beginTransaction((txErr) => {
      if (txErr) {
        return res.status(500).json({ error: "Transaction start failed" });
      }

      const insertBookingSql =
        "INSERT INTO bookings (customer_id, pickup_date, payment_type, special_instruction, status) VALUES (?, ?, ?, ?, 'Pending')";

      db.query(
        insertBookingSql,
        [customer.customer_id, pickup_date, payment_type, special_instruction],
        async (err, result) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ error: "Error adding booking" });
            });
          }

          const bookingId = result.insertId;

          try {
            // Insert services/promo
            const serviceIds = promo ? [promo] : main_services;
            if (serviceIds && serviceIds.length > 0) {
              const serviceDetails = await getServiceDetailsByNames(serviceIds);

              if (serviceDetails.length > 0) {
                const insertServiceSql =
                  "INSERT INTO booking_details (booking_id, service_id, quantity, unit_price) VALUES ?";
                const serviceValues = serviceDetails.map((service) => [
                  bookingId,
                  service.service_id,
                  load || 1,
                  service.price,
                ]);

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
                    "INSERT INTO booking_details (booking_id, service_id, quantity, unit_price) VALUES ?";
                  const supplyValues = supplyDetails.map((service) => {
                    const matchingSupply = suppliesWithQty.find(
                      (s) => s.name === service.service_name
                    );
                    return [
                      bookingId,
                      service.service_id,
                      matchingSupply?.quantity || 1,
                      service.price,
                    ];
                  });

                  await new Promise((resolve, reject) => {
                    db.query(insertSupplySql, [supplyValues], (e3) => {
                      if (e3) return reject(e3);
                      resolve();
                    });
                  });
                }
              }
            }

            // Commit transaction
            db.commit((commitErr) => {
              if (commitErr) {
                return db.rollback(() => {
                  res.status(500).json({ error: "Transaction commit failed" });
                });
              }
              return res.status(201).json({
                message: "Booking added successfully",
                bookingId,
              });
            });
          } catch (insertErr) {
            return db.rollback(() => {
              res.status(500).json({ error: "Error adding booking details" });
            });
          }
        }
      );
    });
  } catch (e) {
    console.error("Booking error:", e);
    return res.status(500).json({ error: "Server error: " + e.message });
  }
};

const getAllBookings = (req, res) => {
  let {
    status, // optional: only this status
    notStatus, // optional: exclude this status (e.g. Pending)
    from,
    to,
    page = 1,
    limit = 20,
    order = "DESC",
  } = req.query;

  const safeOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC";
  const offset = (Number(page) - 1) * Number(limit);

  const whereParts = [];
  const params = [];

  // Normalize quotes/casing
  const clean = (v) => v && v.replace(/^['"]+|['"]+$/g, "").trim();

  status = clean(status);
  notStatus = clean(notStatus);

  if (status && status.toLowerCase() !== "all") {
    whereParts.push("LOWER(b.status) = LOWER(?)");
    params.push(status);
  } else if (notStatus) {
    whereParts.push("LOWER(b.status) <> LOWER(?)");
    params.push(notStatus);
  }

  if (from) {
    whereParts.push("DATE(b.pickup_date) >= ?");
    params.push(from);
  }
  if (to) {
    whereParts.push("DATE(b.pickup_date) <= ?");
    params.push(to);
  }

  const whereClause = whereParts.length
    ? "WHERE " + whereParts.join(" AND ")
    : "";

  const bookingsSql = `
    SELECT 
      b.booking_id,
      c.name AS customer_name,
      c.phone_number,
      c.email,
      c.address,
      b.pickup_date,
      b.payment_type,
      b.special_instruction,
      b.status
    FROM bookings b
    JOIN customers c ON b.customer_id = c.customer_id
    ${whereClause}
    ORDER BY b.booking_id ${safeOrder}
    LIMIT ? OFFSET ?
  `;

  db.query(bookingsSql, [...params, Number(limit), offset], (err, bookings) => {
    if (err)
      return res.status(500).json({ error: "Database error (bookings)" });
    if (!bookings.length) {
      return res.status(200).json({ page: Number(page), total: 0, data: [] });
    }

    const bookingIds = bookings.map((b) => b.booking_id);
    const placeholders = bookingIds.map(() => "?").join(", ");

    const detailsSql = `
      SELECT 
        bd.booking_id,
        bd.service_id,
        bd.quantity,
        bd.unit_price,
        s.service_name,
        s.service_type
      FROM booking_details bd
      JOIN services s ON s.service_id = bd.service_id
      WHERE bd.booking_id IN (${placeholders})
      ORDER BY bd.booking_id, bd.service_id
    `;

    db.query(detailsSql, bookingIds, (dErr, details) => {
      if (dErr)
        return res.status(500).json({ error: "Database error (details)" });

      const byId = new Map();
      for (const b of bookings) {
        byId.set(b.booking_id, { ...b, details: [], total_amount: 0 });
      }

      for (const row of details) {
        const lineTotal = Number(row.unit_price) * Number(row.quantity);
        const bucket = byId.get(row.booking_id);
        if (bucket) {
          bucket.details.push({
            service_id: row.service_id,
            service_name: row.service_name,
            service_type: row.service_type,
            quantity: Number(row.quantity),
            unit_price: Number(row.unit_price),
            line_total: lineTotal,
          });
          bucket.total_amount += lineTotal;
        }
      }

      return res.status(200).json({
        page: Number(page),
        limit: Number(limit),
        total: bookings.length,
        data: Array.from(byId.values()),
      });
    });
  });
};

const declineBooking = (req, res) => {
  const { bookingId } = req.params;

  const declineSql =
    "UPDATE bookings SET status = 'Declined' WHERE booking_id = ?";

  db.query(declineSql, [bookingId], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Database error while declining booking" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    return res.status(200).json({ message: "Booking declined successfully" });
  });
};

const acceptBooking = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const orderCode = await generateOrderCode();
    const totalAmount = await calculateBookingTotal(bookingId);

    db.beginTransaction((txErr) => {
      if (txErr) {
        return res.status(500).json({ error: "Transaction start failed" });
      }

      const acceptSql =
        "UPDATE bookings SET status = 'Accepted' WHERE booking_id = ?";
      db.query(acceptSql, [bookingId], (err, result) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ error: "Error accepting booking" });
          });
        }
        if (result.affectedRows === 0) {
          return db.rollback(() => {
            res.status(404).json({ error: "Booking not found" });
          });
        }

        db.query(
          "SELECT order_id FROM orders WHERE booking_id = ? LIMIT 1",
          [bookingId],
          (checkErr, existing) => {
            if (checkErr) {
              return db.rollback(() => {
                res
                  .status(500)
                  .json({ error: "Error checking existing order" });
              });
            }
            if (existing.length > 0) {
              return db.rollback(() => {
                res
                  .status(409)
                  .json({ error: "Order already exists for this booking" });
              });
            }

            const createOrderSql = `
              INSERT INTO orders (order_code, booking_id, customer_id, total_amount, source, created_at)
              SELECT ?, b.booking_id, b.customer_id, ?, 'Booking', NOW()
              FROM bookings b
              WHERE b.booking_id = ?
            `;
            db.query(
              createOrderSql,
              [orderCode, totalAmount, bookingId],
              (orderErr, orderResult) => {
                if (orderErr) {
                  return db.rollback(() => {
                    res.status(500).json({ error: "Error creating order" });
                  });
                }

                const orderId = orderResult.insertId;

                const copyDetailsSql = `
                  INSERT INTO order_details (order_id, service_id, quantity, unit_price)
                  SELECT ?, bd.service_id, bd.quantity, bd.unit_price
                  FROM booking_details bd
                  WHERE bd.booking_id = ?
                `;
                db.query(copyDetailsSql, [orderId, bookingId], (detailsErr) => {
                  if (detailsErr) {
                    return db.rollback(() => {
                      res
                        .status(500)
                        .json({ error: "Error copying order details" });
                    });
                  }

                  db.commit((commitErr) => {
                    if (commitErr) {
                      return db.rollback(() => {
                        res
                          .status(500)
                          .json({ error: "Transaction commit failed" });
                      });
                    }
                    return res.status(200).json({
                      message: "Booking accepted and order created",
                      orderId,
                      orderCode,
                    });
                  });
                });
              }
            );
          }
        );
      });
    });
  } catch (e) {
    console.error("Accept booking error:", e);
    return res.status(500).json({ error: "Server error: " + e.message });
  }
};

module.exports = { addBooking, getAllBookings, declineBooking, acceptBooking };
