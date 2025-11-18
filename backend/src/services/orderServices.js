const db = require("../config/db");

/**
 * Generates unique order code: ORD{MM}{DD}{YY}{###}
 * Example: ORD111725001
 * @returns {Promise<string>} Generated order code
 */
function generateOrderCode() {
  return new Promise((resolve, reject) => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const datePrefix = `ORD${month}${day}${year}`;

    // Get today's order count
    const countSql = `
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE DATE(created_at) = CURDATE()
    `;

    db.query(countSql, (err, rows) => {
      if (err) return reject(err);

      const todayCount = rows[0]?.count || 0;
      const increment = String(todayCount + 1).padStart(3, "0");
      const orderCode = `${datePrefix}${increment}`;

      resolve(orderCode);
    });
  });
}

module.exports = { generateOrderCode };
