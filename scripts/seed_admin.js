const pool = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Admins table created.');

    const email = 'admin@freshsabjihub.com';
    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const [existing] = await pool.query('SELECT id FROM admins WHERE email = ?', [email]);
    if (existing.length === 0) {
      await pool.query('INSERT INTO admins (email, password_hash) VALUES (?, ?)', [email, hash]);
      console.log('Default admin seeded: admin@freshsabjihub.com / password123');
    } else {
      console.log('Admin already exists.');
    }
    
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

run();
