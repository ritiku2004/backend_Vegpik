const pool = require('../config/db');

const getAdminByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
  return rows[0];
};

module.exports = {
  getAdminByEmail
};
