const pool = require('../config/db');

const getAllActiveBanners = async () => {
  const [rows] = await pool.query(
    'SELECT * FROM banners WHERE is_active = TRUE ORDER BY id ASC'
  );
  return rows;
};

const getAllBanners = async () => {
  const [rows] = await pool.query('SELECT * FROM banners ORDER BY created_at DESC');
  return rows;
};

const createBanner = async (bannerData) => {
  const { title, subtitle, description, image_url, background_color, text_color, is_active, location } = bannerData;
  const [result] = await pool.query(
    'INSERT INTO banners (title, subtitle, description, image_url, background_color, text_color, is_active, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [title, subtitle, description, image_url, background_color, text_color, is_active ?? true, location || 'hometop']
  );
  return result.insertId;
};

const deleteBanner = async (id) => {
  const [result] = await pool.query('DELETE FROM banners WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

const toggleBannerStatus = async (id, is_active) => {
  const [result] = await pool.query('UPDATE banners SET is_active = ? WHERE id = ?', [is_active, id]);
  return result.affectedRows > 0;
};

const getBannerById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM banners WHERE id = ?', [id]);
  return rows[0];
};

const updateBanner = async (id, bannerData) => {
  const { title, subtitle, description, image_url, background_color, text_color, is_active, location } = bannerData;
  const [result] = await pool.query(
    'UPDATE banners SET title = ?, subtitle = ?, description = ?, image_url = ?, background_color = ?, text_color = ?, is_active = ?, location = ? WHERE id = ?',
    [title, subtitle, description, image_url, background_color, text_color, is_active ?? true, location || 'home_top', id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  getAllActiveBanners,
  getAllBanners,
  getBannerById,
  createBanner,
  deleteBanner,
  toggleBannerStatus,
  updateBanner
};
