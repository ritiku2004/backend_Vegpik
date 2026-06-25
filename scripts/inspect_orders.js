require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function run() {
  try {
    const [orders] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');
    for (const o of orders) {
      console.log(`\nOrder ID: ${o.id}, Number: ${o.order_number}`);
      console.log(`Total: ${o.total_amount}, Discount Column: ${o.discount_amount}, Handling: ${o.handling_fee}, Delivery: ${o.delivery_fee}, Tip: ${o.tip_amount}`);
      
      const [items] = await pool.query('SELECT oi.*, p.mrp_price FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [o.id]);
      console.log('Items:');
      items.forEach(item => {
        console.log(`  - ${item.product_name}: Qty ${item.quantity}, Paid Price: ${item.price}, MRP Price: ${item.mrp_price}`);
      });
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
