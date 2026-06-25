require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function run() {
  try {
    console.log('Fixing old addresses...');
    await pool.query(`
      UPDATE user_addresses 
      SET receiver_mobile = '9876543210', receiver_name = 'Ritik'
      WHERE receiver_mobile IS NULL
    `);

    console.log('Fixing old orders...');
    // Order 1
    await pool.query(`
      UPDATE orders 
      SET tip_amount = 25.00, delivery_fee = 15.00, handling_fee = 2.00, discount_amount = 5.00
      WHERE order_number = 'ORD343329'
    `);

    // Order 2
    await pool.query(`
      UPDATE orders 
      SET tip_amount = 50.00, delivery_fee = 10.00, handling_fee = 2.00, discount_amount = 0.00
      WHERE order_number = 'ORD597551'
    `);

    console.log('Data fixed successfully.');
    process.exit(0);
  } catch(e) {
    console.error('Failed to fix data:', e);
    process.exit(1);
  }
}

run();
