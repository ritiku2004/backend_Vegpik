require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.PORT || 3306
  });

  try {
    console.log('Adding is_active to categories...');
    await connection.query('ALTER TABLE categories ADD COLUMN is_active TINYINT(1) DEFAULT 1;');
    console.log('Column added successfully.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column is_active already exists in categories.');
    } else {
      console.error('Error:', error);
    }
  } finally {
    await connection.end();
  }
}

run();
