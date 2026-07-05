const pool = require('../config/db');

const getAdminByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
  return rows[0];
};

const getAdminById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM admins WHERE id = ?', [id]);
  return rows[0];
};

const updateAdminPassword = async (id, passwordHash) => {
  await pool.query('UPDATE admins SET password_hash = ? WHERE id = ?', [passwordHash, id]);
};

const createAdmin = async ({ email, passwordHash }) => {
  const [result] = await pool.query('INSERT INTO admins (email, password_hash) VALUES (?, ?)', [email, passwordHash]);
  return result.insertId;
};

const getAllAdmins = async () => {
  const [rows] = await pool.query('SELECT id, email, is_active, created_at FROM admins ORDER BY id ASC');
  return rows;
};

const deleteAdmin = async (id) => {
  await pool.query('DELETE FROM admins WHERE id = ?', [id]);
};

const updateAdminStatus = async (id, isActive) => {
  await pool.query('UPDATE admins SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
};

module.exports = {
  getAdminByEmail,
  getAdminById,
  updateAdminPassword,
  createAdmin,
  getAllAdmins,
  deleteAdmin,
  updateAdminStatus
};
