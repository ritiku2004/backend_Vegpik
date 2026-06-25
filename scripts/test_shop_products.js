require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function checkShopProducts() {
  const [rows] = await pool.query('SELECT * FROM shop_products');
  console.log('Shop Products count:', rows.length);
  if (rows.length > 0) {
    console.log('Sample:', rows.slice(0, 5));
  }
  process.exit(0);
}
checkShopProducts();
