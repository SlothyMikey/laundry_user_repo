const db = require("../config/db");

/**
 * Calculates total amount from booking_details
 * @param {number} bookingId - Booking ID
 * @returns {Promise<number>} Total amount
 */
function calculateBookingTotal(bookingId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT COALESCE(SUM(quantity * unit_price), 0) as total
      FROM booking_details
      WHERE booking_id = ?
    `;

    db.query(sql, [bookingId], (err, rows) => {
      if (err) return reject(err);
      resolve(Number(rows[0]?.total || 0));
    });
  });
}

module.exports = { calculateBookingTotal };
