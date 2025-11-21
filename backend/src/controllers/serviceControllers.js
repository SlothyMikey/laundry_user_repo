const db = require("../config/db");

const getAllActiveServices = (req, res) => {
  // Include service_id so clients can reliably match services to order details
  const query =
    "SELECT service_id, service_name, price, unit_type, service_type, description FROM services WHERE is_active = 1";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database query error" });
    }
    return res.status(200).json(results);
  });
};

module.exports = {
  getAllActiveServices,
};
