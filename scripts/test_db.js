require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function checkDb() {
  try {
    const [shops] = await pool.query('SELECT * FROM shops');
    console.log('Shops:', shops);
    
    const [users] = await pool.query('SELECT id, email, first_name FROM users');
    console.log('Users count:', users.length);

    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
checkDb();
