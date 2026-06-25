require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('Querying users...');
    const [users] = await pool.query('SELECT id, email, phone_number, first_name FROM users ORDER BY id DESC LIMIT 5');
    console.log(JSON.stringify(users, null, 2));

    console.log('Querying carts...');
    const [carts] = await pool.query('SELECT * FROM carts ORDER BY id DESC LIMIT 10');
    console.log(JSON.stringify(carts, null, 2));

    if (carts.length > 0) {
      const cartIds = carts.map(c => c.id);
      console.log('Querying cart_items for cart IDs:', cartIds);
      const [items] = await pool.query('SELECT * FROM cart_items WHERE cart_id IN (?)', [cartIds]);
      console.log(JSON.stringify(items, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
