require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function run() {
  try {
    const [orders] = await pool.query('SELECT * FROM orders ORDER BY id DESC LIMIT 1');
    if (orders.length > 0) {
      console.log('Last order:', orders[0]);
    } else {
      console.log('No orders found');
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
