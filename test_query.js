require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });

  try {
    console.log('--- ALL CATEGORIES ---');
    const [categories] = await pool.query('SELECT id, name, is_active, sequence FROM categories');
    console.log(categories);

    console.log('\n--- ACTIVE PRODUCTS COUNT PER CATEGORY ---');
    const [productsCount] = await pool.query(`
      SELECT c.id, c.name, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN product_categories pc ON pc.category_id = c.id
      LEFT JOIN products p ON pc.product_id = p.id AND p.is_active = 1
      GROUP BY c.id, c.name
    `);
    console.log(productsCount);

    console.log('\n--- CATEGORIES RETURNED BY getCategoriesByShopId FOR SHOP 1 ---');
    const [shop1Categories] = await pool.query(`
      SELECT DISTINCT c.id, c.name, c.is_active
      FROM categories c
      JOIN product_categories pc ON pc.category_id = c.id
      JOIN products p ON pc.product_id = p.id
      LEFT JOIN shop_products sp ON sp.product_id = p.id AND sp.shop_id = 1
      WHERE COALESCE(sp.is_available, true) = true AND p.is_active = 1 AND c.is_active = 1
    `);
    console.log(shop1Categories);

    console.log('\n--- SHOPS LIST ---');
    const [shops] = await pool.query('SELECT id, name, is_active FROM shops');
    console.log(shops);

  } catch (error) {
    console.error('Error during query:', error);
  } finally {
    await pool.end();
  }
}

main();
