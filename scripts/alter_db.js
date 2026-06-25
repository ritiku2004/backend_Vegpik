const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Password123#',
    database: process.env.DB_NAME || 'grocery_db'
  });

  try {
    // 1. Drop foreign key in cart_items referencing shop_products
    const [rows] = await connection.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'grocery_db' 
      AND TABLE_NAME = 'cart_items' 
      AND COLUMN_NAME = 'shop_product_id' 
      AND REFERENCED_TABLE_NAME = 'shop_products'
    `);
    
    if (rows.length > 0) {
      const constraintName = rows[0].CONSTRAINT_NAME;
      await connection.query(`ALTER TABLE cart_items DROP FOREIGN KEY ${constraintName}`);
      console.log('Dropped foreign key from cart_items');
    }

    // Drop index if it exists for the foreign key
    try {
        await connection.query(`ALTER TABLE cart_items DROP INDEX shop_product_id`);
        console.log('Dropped index shop_product_id');
    } catch(e) {}
    try {
        await connection.query(`ALTER TABLE cart_items DROP INDEX unique_cart_item`);
        console.log('Dropped unique constraint unique_cart_item');
    } catch(e) {}

    // 2. Rename column in cart_items
    try {
        await connection.query(`ALTER TABLE cart_items CHANGE shop_product_id product_id INT NOT NULL`);
        console.log('Changed shop_product_id to product_id');
    } catch(e) {}

    // 3. Add new foreign key to cart_items referencing products
    try {
        await connection.query(`ALTER TABLE cart_items ADD CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE`);
        console.log('Added foreign key referencing products');
    } catch(e) {}
    
    try {
        await connection.query(`ALTER TABLE cart_items ADD CONSTRAINT unique_cart_item UNIQUE (cart_id, product_id)`);
        console.log('Added unique constraint unique_cart_item for product_id');
    } catch(e) {}

    // 4. Drop columns from shop_products
    try {
        await connection.query(`ALTER TABLE shop_products DROP COLUMN price, DROP COLUMN stock_quantity`);
        console.log('Dropped price and stock_quantity from shop_products');
    } catch(e) {}

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
