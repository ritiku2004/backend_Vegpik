const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const mysql = require('mysql2/promise');

const runInitDb = async () => {
  console.log('Connecting to database...');
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true // Allow executing multiple queries at once
    });

    console.log('Connected successfully. Reading SQL script...');
    const sqlScript = fs.readFileSync(path.join(__dirname, 'init_db.sql'), 'utf-8');

    console.log('Executing SQL script...');
    await connection.query(sqlScript);

    console.log('✅ Database initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

runInitDb();
