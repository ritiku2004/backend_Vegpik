require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const orderModel = require('../src/models/orderModel');
const pool = require('../src/config/db');

async function run() {
  try {
    const [users] = await pool.query('SELECT id FROM users LIMIT 1');
    if (users.length > 0) {
      const userId = users[0].id;
      console.log('Fetching orders for user ID:', userId);
      const orders = await orderModel.getOrdersByUserId(userId);
      console.log('Orders found:', orders.length);
      if (orders.length > 0) {
        console.log('First order details:', {
          id: orders[0].id,
          order_number: orders[0].order_number,
          created_at: orders[0].created_at,
          address_line1: orders[0].address_line1,
          itemsCount: orders[0].items.length,
          item1: orders[0].items[0]
        });
      }
    } else {
      console.log('No users found');
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
