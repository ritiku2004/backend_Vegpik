const pool = require('../config/db');

const getAllShops = async () => {
  const [rows] = await pool.query('SELECT * FROM shops ORDER BY created_at DESC');
  return rows;
};

const getShopById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM shops WHERE id = ?', [id]);
  return rows[0];
};

const createShop = async (shopData) => {
  const { name, address, city, latitude, longitude, is_active, delivery_radius_km } = shopData;
  const [result] = await pool.query(
    'INSERT INTO shops (name, address, city, latitude, longitude, is_active, delivery_radius_km) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, address, city, latitude, longitude, is_active ?? true, delivery_radius_km ?? 15.0]
  );
  return result.insertId;
};

const updateShop = async (id, shopData) => {
  const { name, address, city, latitude, longitude, is_active, delivery_radius_km } = shopData;
  const [result] = await pool.query(
    'UPDATE shops SET name=?, address=?, city=?, latitude=?, longitude=?, is_active=?, delivery_radius_km=? WHERE id=?',
    [name, address, city, latitude, longitude, is_active, delivery_radius_km ?? 15.0, id]
  );
  return result.affectedRows > 0;
};

const deleteShop = async (id) => {
  const [result] = await pool.query('DELETE FROM shops WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = {
  getAllShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop
};

