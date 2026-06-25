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

const getInventoryByShopId = async (shopId) => {
  const [rows] = await pool.query(`
    SELECT p.id as product_id, p.name as product_name, p.description, p.brand, 
           p.quantity, p.quantity_type, p.mrp_price as price, p.image_url, 
           p.category_id, c.name as category_name, p.discount_percentage,
           COALESCE(sp.is_available, true) as is_available,
           GROUP_CONCAT(pc.category_id) as category_ids
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_categories pc ON p.id = pc.product_id
    LEFT JOIN shop_products sp ON p.id = sp.product_id AND sp.shop_id = ?
    WHERE p.is_active = true
    GROUP BY p.id, sp.is_available
    ORDER BY p.name ASC
  `, [shopId]);
  
  // Note: we alias p.id to product_id and p.name to product_name and p.mrp_price to price
  // to ensure compatibility with the existing frontend format expectations 
  // without having to rewrite the entire table renderer.
  
  return rows;
};

module.exports = {
  toggleShopProduct,
  getInventoryByShopId
};
