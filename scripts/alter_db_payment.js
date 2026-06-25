require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function run() {
  try {
    console.log('Altering orders status enum...');
    // Modify status ENUM on orders table to support 'Pending Payment' and 'Placed'
    await pool.query(`
      ALTER TABLE orders 
      MODIFY COLUMN status ENUM('Pending Payment', 'Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled') 
      DEFAULT 'Pending Payment'
    `);
    console.log('Orders status enum updated successfully.');

    // Add new columns to orders
    const columnsToAdd = [
      { name: 'razorpay_order_id', definition: 'VARCHAR(255) NULL' },
      { name: 'razorpay_payment_id', definition: 'VARCHAR(255) NULL' },
      { name: 'razorpay_signature', definition: 'VARCHAR(255) NULL' },
      { name: 'tax_amount', definition: 'DECIMAL(10, 2) DEFAULT 0.00' }
    ];

    for (const col of columnsToAdd) {
      try {
        console.log(`Adding column ${col.name} to orders table...`);
        await pool.query(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.definition}`);
        console.log(`Column ${col.name} added.`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`Column ${col.name} already exists. Skipping.`);
        } else {
          throw err;
        }
      }
    }

    // Add stock_quantity to products
    try {
      console.log('Adding stock_quantity to products table...');
      await pool.query('ALTER TABLE products ADD COLUMN stock_quantity INT DEFAULT 100');
      console.log('Column stock_quantity added to products.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Column stock_quantity already exists in products. Skipping.');
      } else {
        throw err;
      }
    }

    // Create payment_logs table
    console.log('Creating payment_logs table if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        razorpay_order_id VARCHAR(255) NULL,
        razorpay_payment_id VARCHAR(255) NULL,
        event_type VARCHAR(100) NOT NULL,
        payload TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);
    console.log('payment_logs table created successfully.');

    console.log('All payment database alterations completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to alter database for payment:', error);
    process.exit(1);
  }
}

run();
