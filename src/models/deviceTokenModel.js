const pool = require('../config/db');

const saveToken = async ({ userId = null, token, isAdmin = false }) => {
  await pool.query(
    `INSERT INTO device_tokens (user_id, is_admin, token) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), is_admin = VALUES(is_admin)`,
    [userId, isAdmin, token]
  );
};

const getTokensByUser = async (userId) => {
  const [rows] = await pool.query('SELECT token FROM device_tokens WHERE user_id = ?', [userId]);
  return rows.map(r => r.token);
};

const getAdminTokens = async () => {
  const [rows] = await pool.query('SELECT token FROM device_tokens WHERE is_admin = true');
  return rows.map(r => r.token);
};

const deleteToken = async (token) => {
  await pool.query('DELETE FROM device_tokens WHERE token = ?', [token]);
};

module.exports = {
  saveToken,
  getTokensByUser,
  getAdminTokens,
  deleteToken
};
