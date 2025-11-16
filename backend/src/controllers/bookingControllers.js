const db = require("../config/db");
const { findOrCreateCustomerByPhone } = require("../services/customerService");
const { getServiceDetailsByNames } = require("../services/serviceServices");

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

    const insertBookingSql =
      "INSERT INTO bookings (customer_id, pickup_date, payment_type, special_instruction) VALUES (?, ?, ?, ?)";

    db.query(
      insertBookingSql,
      [customer.customer_id, pickup_date, payment_type, special_instruction],
      async (err, result) => {
        if (err) return res.status(500).json({ error: "Error adding booking" });

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

          // Send response ONLY after all inserts complete
          return res.status(201).json({
            message: "Booking added successfully",
            bookingId,
          });
        } catch (insertErr) {
          console.error("Insert error:", insertErr);
          return res
            .status(500)
            .json({ error: "Error adding booking details" });
        }
      }
    );
  } catch (e) {
    console.error("Booking error:", e);
    return res.status(500).json({ error: "Server error: " + e.message });
  }
};

module.exports = { addBooking };
