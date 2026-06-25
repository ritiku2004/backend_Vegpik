require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function run() {
  try {
    console.log('Dropping zipcode from user_addresses...');
    // We check if the column exists first or just drop it. MySQL doesn't support DROP COLUMN IF EXISTS in older versions without custom check, but we can do it directly.
    try {
      await pool.query('ALTER TABLE user_addresses DROP COLUMN zipcode');
      console.log('Successfully dropped zipcode from user_addresses.');
    } catch (e) {
      console.log('Column zipcode in user_addresses might already be dropped or failed:', e.message);
    }

    console.log('Dropping zipcode from shops...');
    try {
      await pool.query('ALTER TABLE shops DROP COLUMN zipcode');
      console.log('Successfully dropped zipcode from shops.');
    } catch (e) {
      console.log('Column zipcode in shops might already be dropped or failed:', e.message);
    }

    console.log('Migration script complete.');
    process.exit(0);
  } catch (e) {
    console.error('Failed to run migration:', e);
    process.exit(1);
  }
}

run();
