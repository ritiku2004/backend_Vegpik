require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const orderModel = require('../src/models/orderModel');

async function run() {
  try {
    const items = [
      { id: 1, name: 'Test Product', quantity: 1, price: 50.00 }
    ];
    console.log('Testing createOrder...');
    const result = await orderModel.createOrder(
      1, // userId
      1, // shopId
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
