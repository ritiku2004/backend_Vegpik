require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const orderModel = require('../src/models/orderModel');
const pool = require('../src/config/db');

async function run() {
  try {
    const [users] = await pool.query('SELECT id FROM users LIMIT 1');
    const [shops] = await pool.query('SELECT id FROM shops LIMIT 1');
    const [products] = await pool.query('SELECT id FROM products LIMIT 1');

    if (!users.length || !shops.length || !products.length) {
      console.log('Missing basic data');
      process.exit(0);
    }

    const userId = users[0].id;
    const shopId = shops[0].id;
    const productId = products[0].id;

    const items = [
      { productId: productId, name: 'Test Product', quantity: 1, price: 50.00 }
    ];
    console.log(`Testing createOrder with User ${userId}, Shop ${shopId}, Product ${productId}...`);
    const result = await orderModel.createOrder(
      userId, 
      shopId, 
      null, // addressId
      50.00, // totalAmount
      items, 
      0, 0, 0, 0
    );
    console.log('Order created:', result);
  } catch(e) {
    console.error('Error caught in run():', e);
  } finally {
    process.exit(0);
  }
}

run();
