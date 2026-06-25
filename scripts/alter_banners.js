const pool = require('../src/config/db');

async function run() {
  try {
    await pool.query("ALTER TABLE banners ADD COLUMN location VARCHAR(50) DEFAULT 'hometop';");
    console.log('Location column added successfully.');
    process.exit(0);
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
      process.exit(0);
    }
    console.error(e);
    process.exit(1);
  }
}

run();
