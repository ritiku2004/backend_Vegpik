require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');
const { getCartByUserId } = require('../src/models/cartModel');

async function run() {
  try {
    const cart = await getCartByUserId(7, 4, null);
    console.log('Cart fetched via getCartByUserId(7, 4, null):', JSON.stringify(cart, null, 2));

    const cartNoShop = await getCartByUserId(7, null, null);
    console.log('Cart fetched via getCartByUserId(7, null, null):', JSON.stringify(cartNoShop, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
