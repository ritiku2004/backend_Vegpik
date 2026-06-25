const pool = require('../config/db');

const getAllCategories = async () => {
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY sequence ASC, created_at DESC');
  return rows;
};

const getCategoryById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0];
};

const getCategoriesByShopId = async (shopId) => {
  const [rows] = await pool.query(`
    SELECT DISTINCT c.*
    FROM categories c
    JOIN product_categories pc ON pc.category_id = c.id
    JOIN products p ON pc.product_id = p.id
    LEFT JOIN shop_products sp ON sp.product_id = p.id AND sp.shop_id = ?
    WHERE COALESCE(sp.is_available, true) = true AND p.is_active = true
    ORDER BY c.sequence ASC, c.created_at DESC
  `, [shopId]);
  return rows;
};

const createCategory = async (categoryData) => {
  const { name, description, image_url, sequence = 0 } = categoryData;
  const [result] = await pool.query(
    'INSERT INTO categories (name, description, image_url, sequence) VALUES (?, ?, ?, ?)',
    [name, description, image_url, Number(sequence)]
  );
  return result.insertId;
};

const updateCategory = async (id, categoryData) => {
  const { name, description, image_url, sequence = 0 } = categoryData;
  const [result] = await pool.query(
    'UPDATE categories SET name = ?, description = ?, image_url = ?, sequence = ? WHERE id = ?',
    [name, description, image_url, Number(sequence), id]
  );
  return result.affectedRows > 0;
};

const deleteCategory = async (id) => {
  const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoriesByShopId,
  createCategory,
  updateCategory,
  deleteCategory
};
