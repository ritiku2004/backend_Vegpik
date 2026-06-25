const pool = require('../src/config/db');

async function run() {
  try {
    console.log('Creating device_tokens table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        token VARCHAR(255) PRIMARY KEY,
        user_id INT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('device_tokens table created successfully.');
    process.exit(0);
  } catch (e) {
    console.error('Failed to create device_tokens table:', e);
    process.exit(1);
  }
}

run();
