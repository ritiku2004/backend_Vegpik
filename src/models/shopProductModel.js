const pool = require('../config/db');

const toggleShopProduct = async (shopId, productId, isAvailable) => {
  const [result] = await pool.query(
    `INSERT INTO shop_products (shop_id, product_id, is_available) 
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE is_available = VALUES(is_available)`,
    [shopId, productId, isAvailable]
  );
  return result.affectedRows > 0;
};

const getInventoryByShopId = async (shopId, filters = {}) => {
  // Select columns compatible with shopInventory
  const selectColumns = `
    p.id as product_id, p.name as product_name, p.description, p.brand, 
    p.quantity, p.quantity_type, p.mrp_price as price, p.image_url, 
    p.category_id, c.name as category_name, p.discount_percentage,
    p.type, p.is_active,
    COALESCE(sp.is_available, true) as is_available
  `;

  if (filters.forHome) {
    const homeQuery = `
      (
        SELECT ${selectColumns}
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN shop_products sp ON p.id = sp.product_id AND sp.shop_id = ?
        WHERE p.is_active = 1 AND p.type = 'trending'
        ORDER BY p.created_at DESC
        LIMIT 10
      )
      UNION
      (
        SELECT ${selectColumns}
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN shop_products sp ON p.id = sp.product_id AND sp.shop_id = ?
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
        LEFT JOIN shop_products sp ON p.id = sp.product_id AND sp.shop_id = ?
        WHERE p.rn <= 10
      )
    `;

    const [rows] = await pool.query(homeQuery, [shopId, shopId, shopId]);
    return rows;
  }

  // Dynamic filter query
  let query = `
    SELECT ${selectColumns}
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN shop_products sp ON p.id = sp.product_id AND sp.shop_id = ?
  `;

  const conditions = ['p.is_active = 1'];
  const params = [shopId];

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
  if (filters.limit) {
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN shop_products sp ON p.id = sp.product_id AND sp.shop_id = ?
    `;
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const [countRows] = await pool.query(countQuery, params);
    total = countRows[0].total;
  }

  if (filters.limit) {
    const limitVal = parseInt(filters.limit, 10);
    const pageVal = parseInt(filters.page || 1, 10);
    const offsetVal = (pageVal - 1) * limitVal;
    query += ' LIMIT ? OFFSET ?';
    params.push(limitVal, offsetVal);
  }

  const [rows] = await pool.query(query, params);

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

module.exports = {
  toggleShopProduct,
  getInventoryByShopId
};
