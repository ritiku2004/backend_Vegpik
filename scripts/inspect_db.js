require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function run() {
  try {
    const [carts] = await pool.query('SELECT * FROM carts');
    console.log('Carts:', carts);
    
    const [cartItems] = await pool.query('SELECT * FROM cart_items');
    console.log('Cart Items:', cartItems);

    const [users] = await pool.query('SELECT * FROM users');
    console.log('Users:', users);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
