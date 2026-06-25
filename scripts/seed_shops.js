const pool = require('../src/config/db');

async function run() {
  try {
    const shops = [
      ['Shop One - Downtown', '123 Downtown St', '10.0000', '20.0000', 1, 1],
      ['Shop Two - Uptown', '456 Uptown Ave', '10.1000', '20.1000', 1, 1],
      ['Shop Three - Suburbs', '789 Suburbia Blvd', '10.2000', '20.2000', 1, 1]
    ];
    
    // Check if shops exist
    const [existing] = await pool.query('SELECT id FROM shops');
    if (existing.length === 0) {
      for (const shop of shops) {
        await pool.query(
          'INSERT INTO shops (name, address, latitude, longitude, is_active, admin_id) VALUES (?, ?, ?, ?, ?, ?)',
          shop
        );
      }
      console.log('Successfully inserted 3 shops.');
    } else {
      console.log('Shops already exist in the database.');
    }
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

run();
