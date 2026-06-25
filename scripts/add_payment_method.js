require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function run() {
  try {
    console.log('Altering orders table for new payment requirements...');
    
    // Add payment_method column if not exists
    try {
      await pool.query("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'COD'");
      console.log('payment_method column added successfully.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('payment_method column already exists.');
      } else {
        throw err;
      }
    }

    // Modify payment_status to support uppercase PENDING, PAID, FAILED, and VARCHAR for flexibility
    await pool.query("ALTER TABLE orders MODIFY COLUMN payment_status VARCHAR(50) DEFAULT 'PENDING'");
    console.log('payment_status column modified to VARCHAR(50) successfully.');

    // Update existing records to uppercase for consistency
    await pool.query("UPDATE orders SET payment_status = 'PENDING' WHERE payment_status = 'Pending' OR payment_status IS NULL");
    await pool.query("UPDATE orders SET payment_status = 'PAID' WHERE payment_status = 'Paid'");
    await pool.query("UPDATE orders SET payment_status = 'FAILED' WHERE payment_status = 'Failed'");
    console.log('Existing payment statuses migrated to uppercase.');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();
