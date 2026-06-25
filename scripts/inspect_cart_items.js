require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function run() {
  try {
    const [products] = await pool.query('SELECT id, name, mrp_price, is_active FROM products WHERE id IN (11, 1, 2)');
    console.log('Products:', products);

    const [shopProducts] = await pool.query('SELECT * FROM shop_products WHERE shop_id = 4 AND product_id IN (11, 1, 2)');
    console.log('Shop Products for Shop 4:', shopProducts);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
