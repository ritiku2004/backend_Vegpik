const pool = require('../config/db');

const addReceipt = async (orderId, fileName, fileBuffer) => {
  const [result] = await pool.query(
    'INSERT INTO receipts (order_id, file_name, file_data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE file_name = VALUES(file_name), file_data = VALUES(file_data)',
    [orderId, fileName, fileBuffer]
  );
  return result.insertId;
};

const getReceiptByOrderId = async (orderId) => {
  const [rows] = await pool.query(
    'SELECT file_name, file_data FROM receipts WHERE order_id = ?',
    [orderId]
  );
  return rows[0] || null;
};

module.exports = {
  addReceipt,
  getReceiptByOrderId
};
