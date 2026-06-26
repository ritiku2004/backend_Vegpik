require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

(async () => {
  try {
    // Test the exact query that was failing
    const [r1] = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status NOT IN ('Delivered', 'Cancelled')");
    console.log('✔ orders query OK:', JSON.stringify(r1[0]));
    
    const [r2] = await pool.query('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
    console.log('✔ products query OK:', JSON.stringify(r2[0]));
    
    const [r3] = await pool.query('SELECT id, name FROM categories ORDER BY sequence ASC');
    console.log('✔ categories query OK, count:', r3.length);
    
    const [r4] = await pool.query('SELECT p.id, p.name, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC');
    console.log('✔ products+categories join OK, count:', r4.length);

    const [r5] = await pool.query("SELECT COUNT(*) as totalSales, COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE status != 'Cancelled'");
    console.log('✔ dashboard sales query OK:', JSON.stringify(r5[0]));
    
    console.log('\nAll queries PASSED! DB is ready.');
  } catch(e) {
    console.error('FAIL:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
