require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function run() {
  try {
    console.log('Adding columns to user_addresses...');
    await pool.query(`
      ALTER TABLE user_addresses 
      ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS receiver_mobile VARCHAR(20)
    `);

    console.log('Adding columns to orders...');
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS handling_fee DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2) DEFAULT 0
    `);

    console.log('Database schema altered successfully.');
    process.exit(0);
  } catch(e) {
    console.error('Failed to alter schema:', e);
    process.exit(1);
  }
}

run();
