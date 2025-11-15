const db = require("../config/db");

function findOrCreateCustomerByPhone({ name, phone_number, email, address }) {
  return new Promise((resolve, reject) => {
    const selectSql =
      "SELECT customer_id, name, email, address FROM customers WHERE phone_number = ? LIMIT 1";
    db.query(selectSql, [phone_number], (err, rows) => {
      if (err) return reject(err);
      if (rows && rows.length > 0) return resolve(rows[0]);

      const insertSql =
        "INSERT INTO customers (name, phone_number, email, address) VALUES (?, ?, ?, ?)";
      db.query(
        insertSql,
        [name, phone_number, email, address],
        (e2, result) => {
          if (e2) return reject(e2);
          resolve({
            customer_id: result.insertId,
            name,
            email,
            address,
          });
        }
      );
    });
  });
}

module.exports = { findOrCreateCustomerByPhone };
