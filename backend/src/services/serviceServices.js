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

const getServiceDetailsByIds = (serviceIds) => {
  return new Promise((resolve, reject) => {
    if (!serviceIds || serviceIds.length === 0) {
      return resolve([]);
    }

    const placeholders = serviceIds.map(() => "?").join(", ");
    const query = `SELECT service_id, service_name, price, unit_type, service_type, description FROM services WHERE service_id IN (${placeholders}) AND is_active = 1`;

    db.query(query, serviceIds, (err, results) => {
      if (err) return reject(err);
      resolve(results || []);
    });
  });
};

module.exports = {
  getServiceDetailsByNames,
  getServiceDetailsByIds,
};
