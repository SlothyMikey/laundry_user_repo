const db = require("../config/db");

const getServiceDetailsByNames = (serviceNames) => {
  return new Promise((resolve, reject) => {
    if (serviceNames.length === 0) {
      return resolve([]);
    }
    const placeholders = serviceNames.map(() => "?").join(", ");
    console.log("Service Names:", serviceNames);
    const query = `SELECT service_id, service_name, price, unit_type, service_type, description FROM services WHERE service_name IN (${placeholders}) AND is_active = 1`;
    db.query(query, serviceNames, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

module.exports = {
  getServiceDetailsByNames,
};
