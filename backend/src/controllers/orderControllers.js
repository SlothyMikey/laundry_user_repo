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
  } = req.body;

  // Validate required fields
  if (!guest_name) {
    return res.status(400).json({ error: "guest_name is required" });
  }

  try {
    const orderCode = await generateOrderCode();

    db.beginTransaction((err) => {
      if (err) {
        return res.status(500).json({ error: "Database transaction error" });
      }

      const orderQuery =
        "INSERT INTO orders (order_code, guest_name, guest_phone, total_amount, payment_type, payment_status, source, created_at) VALUES (?, ?, ?, ?, ?, ?, 'walk-in', NOW())";

      db.query(
        orderQuery,
        [
          orderCode,
          guest_name,
          guest_phone_number || null,
          total_amount || 0,
          payment_type || "Cash",
          payment_status || "Unpaid",
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

module.exports = { createWalkInOrder };
