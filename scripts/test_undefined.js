require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function testUndefined() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    console.log('About to execute with undefined...');
    await connection.query('INSERT INTO shops (name) VALUES (?)', [undefined]);
    console.log('Success?');
  } catch (err) {
    console.error('Caught error!', err.message);
    await connection.rollback();
  } finally {
    connection.release();
    console.log('Released');
    process.exit(0);
  }
}
testUndefined();
