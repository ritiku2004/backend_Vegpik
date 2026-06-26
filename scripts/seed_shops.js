const pool = require('../src/config/db');

async function run() {
  try {
    const shops = [
      ['Vegpik - Dubai Marina', 'Dubai Marina Walk, Dubai', '25.0800', '55.1400', 1, 1],
      ['Vegpik - Deira', 'Al Rigga Rd, Deira, Dubai', '25.2650', '55.3270', 1, 1],
      ['Vegpik - Sharjah', 'King Faisal St, Sharjah', '25.3463', '55.4209', 1, 1]
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
