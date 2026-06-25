require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function run() {
  try {
    const [rows] = await pool.query('SELECT NOW() as local_now, UTC_TIMESTAMP() as utc_now, @@global.time_zone as global_tz, @@session.time_zone as session_tz');
    console.log('MySQL server time query results:', rows[0]);
    console.log('Node process time:', new Date().toISOString(), 'Local time string:', new Date().toString());
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
