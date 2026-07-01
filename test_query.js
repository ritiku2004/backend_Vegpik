require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });

  try {
    console.log('Querying orders...');
    const [orders] = await pool.query('SELECT * FROM orders ORDER BY id DESC LIMIT 5');
    console.log('Last 5 orders:');
    console.log(orders.map(o => ({ id: o.id, order_number: o.order_number })));

    console.log('Querying order details for ORD492565...');
    const queryField = 'o.order_number';
    const [rows] = await pool.query(`
      SELECT o.*, u.first_name, u.last_name, u.phone_number as user_phone, s.name as shop_name,
             a.address_line1, a.address_line2, a.city, a.state,
             a.receiver_name, a.receiver_mobile, a.latitude, a.longitude
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN shops s ON o.shop_id = s.id
      LEFT JOIN user_addresses a ON o.address_id = a.id
      WHERE \${queryField} = ?
    `, ['ORD492565']);
    console.log('Rows found:', rows.length);
    if (rows.length > 0) {
      console.log(rows[0]);
    }
  } catch (error) {
    console.error('Error during query:', error);
  } finally {
    await pool.end();
  }
}

main();
