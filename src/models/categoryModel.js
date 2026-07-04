const pool = require('../config/db');

const getAllCategories = async (includeInactive = false) => {
  let query = 'SELECT * FROM categories';
  if (!includeInactive) {
    query += ' WHERE is_active = 1';
  }
  query += ' ORDER BY sequence ASC, created_at DESC';
  const [rows] = await pool.query(query);
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
    WHERE COALESCE(sp.is_available, true) = true AND p.is_active = 1 AND c.is_active = 1
    ORDER BY c.sequence ASC, c.created_at DESC
  `, [shopId]);
  return rows;
};

const createCategory = async (categoryData) => {
  const { name, description, image_url, sequence = 0 } = categoryData;
  const [result] = await pool.query(
    'INSERT INTO categories (name, description, image_url, sequence, is_active) VALUES (?, ?, ?, ?, 1)',
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
  // Check if there are any ACTIVE products in this category
  const [activeProducts] = await pool.query(`
    SELECT count(*) as count 
    FROM product_categories pc 
    JOIN products p ON pc.product_id = p.id 
    WHERE pc.category_id = ? AND p.is_active = 1
  `, [id]);
  
  if (activeProducts[0].count > 0) {
    throw new Error('HAS_ACTIVE_PRODUCTS');
  }

  // Soft delete: inactivate the category
  const [result] = await pool.query('UPDATE categories SET is_active = 0 WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

const toggleCategoryStatus = async (id, is_active) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query('UPDATE categories SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
    
    // If deactivating, deactivate all products in this category
    if (!is_active || is_active === '0' || is_active === 'false') {
      await conn.query(`
        UPDATE products p
        JOIN product_categories pc ON pc.product_id = p.id
        SET p.is_active = 0
        WHERE pc.category_id = ?
      `, [id]);
    }
    await conn.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoriesByShopId,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
};
