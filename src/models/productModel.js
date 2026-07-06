const pool = require('../config/db');

const getAllProducts = async (filters = {}, includeInactive = false) => {
  // Backward compatibility check
  if (typeof filters === 'boolean') {
    includeInactive = filters;
    filters = {};
  }

  const selectColumns = `
    p.id, p.category_id, p.name, p.description, p.brand, p.mrp_price,
    p.quantity, p.quantity_type, p.sku, p.image_url, p.is_active,
    p.discount_percentage, p.stock_quantity, p.type, p.is_available,
    p.created_at, p.updated_at, c.name as category_name
  `;

  if (filters.forHome) {
    // Optimised home screen products query using window functions and UNION
    const homeQuery = `
      (
        SELECT ${selectColumns}
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1 AND p.type = 'trending'
        ORDER BY p.created_at DESC
        LIMIT 10
      )
      UNION
      (
        SELECT ${selectColumns}
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1 AND p.type = 'best deal'
        ORDER BY p.created_at DESC
        LIMIT 10
      )
      UNION
      (
        SELECT ${selectColumns}
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at DESC) as rn
          FROM products
          WHERE is_active = 1
        ) p
        JOIN categories c ON p.category_id = c.id
        WHERE p.rn <= 10
      )
    `;

    const [rows] = await pool.query(homeQuery);
    rows.forEach(r => {
      if (typeof r.images === 'string') {
        try { r.images = JSON.parse(r.images); } catch(e) { r.images = []; }
      } else if (!r.images) {
        r.images = [];
      }
    });
    return rows;
  }

  // Dynamic filter query
  let query = `
    SELECT p.*, c.name as category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
  `;

  const conditions = [];
  const params = [];

  if (!includeInactive) {
    conditions.push('p.is_active = 1');
  }

  if (filters.categoryId) {
    conditions.push('p.category_id = ?');
    params.push(filters.categoryId);
  }

  if (filters.search) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)');
    const searchVal = `%${filters.search}%`;
    params.push(searchVal, searchVal, searchVal);
  }

  if (filters.type) {
    conditions.push('p.type = ?');
    params.push(filters.type === 'best_deal' ? 'best deal' : filters.type);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // Sorting
  if (filters.sortBy === 'price-low-to-high') {
    query += ' ORDER BY IF(p.discount_percentage > 0, p.mrp_price - (p.mrp_price * p.discount_percentage / 100), p.mrp_price) ASC';
  } else if (filters.sortBy === 'price-high-to-low') {
    query += ' ORDER BY IF(p.discount_percentage > 0, p.mrp_price - (p.mrp_price * p.discount_percentage / 100), p.mrp_price) DESC';
  } else if (filters.sortBy === 'discount') {
    query += ' ORDER BY p.discount_percentage DESC';
  } else {
    query += ' ORDER BY p.created_at DESC';
  }

  let total = 0;
  // If limit is provided, fetch count for pagination
  if (filters.limit) {
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      JOIN categories c ON p.category_id = c.id
    `;
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const [countRows] = await pool.query(countQuery, params);
    total = countRows[0].total;
  }

  // Apply limit and offset for pagination
  if (filters.limit) {
    const limitVal = parseInt(filters.limit, 10);
    const pageVal = parseInt(filters.page || 1, 10);
    const offsetVal = (pageVal - 1) * limitVal;
    query += ' LIMIT ? OFFSET ?';
    params.push(limitVal, offsetVal);
  }

  const [rows] = await pool.query(query, params);
  rows.forEach(r => {
    if (typeof r.images === 'string') {
      try { r.images = JSON.parse(r.images); } catch(e) { r.images = []; }
    } else if (!r.images) {
      r.images = [];
    }
  });

  if (filters.limit) {
    const pageVal = parseInt(filters.page || 1, 10);
    const limitVal = parseInt(filters.limit, 10);
    const offsetVal = (pageVal - 1) * limitVal;
    return {
      products: rows,
      totalCount: total,
      hasMore: (offsetVal + rows.length) < total
    };
  }

  return rows;
};

const getProductById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  
  if (rows.length === 0) return null;
  const product = rows[0];

  // Fetch features
  const [features] = await pool.query('SELECT feature_name, feature_value FROM product_features WHERE product_id = ?', [id]);
  product.features = features;
  
  if (typeof product.images === 'string') {
    try { product.images = JSON.parse(product.images); } catch(e) { product.images = []; }
  } else if (!product.images) {
    product.images = [];
  }

  return product;
};
const createProduct = async (productData, featuresData = []) => {
  const { category_id, name, description, brand, mrp_price, quantity, quantity_type, sku, image_url, images, is_active, discount_percentage, type, is_available } = productData;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const imagesJson = images ? JSON.stringify(images) : null;
    const finalImageUrl = image_url || (images && images.length > 0 ? images[0] : null);

    const [result] = await connection.query(
      'INSERT INTO products ' +
      '(category_id, name, description, brand, mrp_price, quantity, quantity_type, sku, image_url, images, is_active, discount_percentage, type, is_available) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [category_id, name, description, brand, mrp_price, quantity, quantity_type, sku, finalImageUrl, imagesJson, is_active ?? true, discount_percentage ?? 0.00, type || 'general', is_available ?? true]
    );
    const productId = result.insertId;

    // Sync to product_categories
    await connection.query(
      'INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)',
      [productId, category_id]
    );

    if (featuresData && featuresData.length > 0) {
      const featureValues = featuresData.map(f => [productId, f.feature_name, f.feature_value]);
      await connection.query(
        'INSERT INTO product_features (product_id, feature_name, feature_value) VALUES ?',
        [featureValues]
      );
    }

    await connection.commit();
    return productId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateProduct = async (id, productData, featuresData = null) => {
  const { category_id, name, description, brand, mrp_price, quantity, quantity_type, sku, image_url, images, is_active, discount_percentage, type, is_available } = productData;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const imagesJson = images ? JSON.stringify(images) : null;
    const finalImageUrl = image_url || (images && images.length > 0 ? images[0] : null);

    await connection.query(
      'UPDATE products ' +
      'SET category_id=?, name=?, description=?, brand=?, mrp_price=?, quantity=?, quantity_type=?, sku=?, image_url=?, images=?, is_active=?, discount_percentage=?, type=?, is_available=? ' +
      'WHERE id=?',
      [category_id, name, description, brand, mrp_price, quantity, quantity_type, sku, finalImageUrl, imagesJson, is_active ?? true, discount_percentage ?? 0.00, type || 'general', is_available ?? true, id]
    );

    // Sync to product_categories
    await connection.query(
      'INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)',
      [id, category_id]
    );

    if (featuresData !== null) {
      // Replace all features
      await connection.query('DELETE FROM product_features WHERE product_id = ?', [id]);
      if (featuresData.length > 0) {
        const featureValues = featuresData.map(f => [id, f.feature_name, f.feature_value]);
        await connection.query(
          'INSERT INTO product_features (product_id, feature_name, feature_value) VALUES ?',
          [featureValues]
        );
      }
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const deleteProduct = async (id) => {
  // Soft delete: inactivate the product instead of deleting it
  const [result] = await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

const toggleProductStatus = async (id, is_active) => {
  const [result] = await pool.query('UPDATE products SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
  return result.affectedRows > 0;
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus
};
