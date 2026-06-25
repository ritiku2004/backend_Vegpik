const pool = require('../config/db');

const createNotification = async (userId, title, message, type = 'system', data = null) => {
  const jsonData = data ? JSON.stringify(data) : null;
  const [result] = await pool.query(
    'INSERT INTO notifications (user_id, title, message, type, data) VALUES (?, ?, ?, ?, ?)',
    [userId, title, message, type, jsonData]
  );
  return result.insertId;
};

const getNotificationsByUser = async (userId) => {
  const [rows] = await pool.query(
    'SELECT id, title, message, type, data, is_read as isRead, created_at as createdAt FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
    [userId]
  );
  return rows.map(r => ({
    ...r,
    data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data
  }));
};

const markAsRead = async (id, userId) => {
  const [result] = await pool.query(
    'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
};

const markAllAsRead = async (userId) => {
  const [result] = await pool.query(
    'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
    [userId]
  );
  return result.affectedRows > 0;
};

const deleteNotification = async (id, userId) => {
  const [result] = await pool.query(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
};

const clearAll = async (userId) => {
  const [result] = await pool.query(
    'DELETE FROM notifications WHERE user_id = ?',
    [userId]
  );
  return result.affectedRows > 0;
};

module.exports = {
  createNotification,
  getNotificationsByUser,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll
};
