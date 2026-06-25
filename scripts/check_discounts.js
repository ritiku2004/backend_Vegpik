require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function run() {
  try {
    const [orders] = await pool.query('SELECT id, order_number, user_id, total_amount, discount_amount, tip_amount, handling_fee, delivery_fee FROM orders');
    console.log('List of all orders in database:');
    orders.forEach(o => {
      console.log(`Order #${o.order_number}: Total=${o.total_amount}, Discount=${o.discount_amount}, Handling=${o.handling_fee}, Delivery=${o.delivery_fee}`);
    });
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
