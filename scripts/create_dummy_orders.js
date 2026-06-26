require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const orderModel = require('../src/models/orderModel');
const pool = require('../src/config/db');

async function run() {
  try {
    const [users] = await pool.query('SELECT id FROM users LIMIT 1');
    const [shops] = await pool.query('SELECT id FROM shops LIMIT 1');
    const [products] = await pool.query('SELECT id, name, mrp_price FROM products LIMIT 5');

    if (!users.length || !shops.length || !products.length) {
      console.log('❌ Missing basic data in users, shops, or products. Please seed database first.');
      process.exit(1);
    }

    const userId = users[0].id;
    const shopId = shops[0].id;
    
    const dummyTemplates = [
      {
        items: [
          { productId: products[0].id, name: products[0].name, quantity: 2, price: parseFloat(products[0].mrp_price) }
        ],
        tip: 5.00,
        discount: 10.00
      },
      {
        items: products.slice(0, 3).map(p => ({
          productId: p.id,
          name: p.name,
          quantity: 1,
          price: parseFloat(p.mrp_price)
        })),
        tip: 0,
        discount: 0
      },
      {
        items: [
          { productId: products[products.length - 1].id, name: products[products.length - 1].name, quantity: 5, price: parseFloat(products[products.length - 1].mrp_price) }
        ],
        tip: 10.00,
        discount: 15.00
      }
    ];

    console.log('Creating 3 dummy orders...');
    for (let i = 0; i < dummyTemplates.length; i++) {
      const template = dummyTemplates[i];
      const details = await orderModel.calculateOrderDetails(
        userId,
        shopId,
        null,
        template.items,
        template.tip,
        template.discount
      );

      const result = await orderModel.createOrder(
        userId,
        shopId,
        details.addressIdToUse || null,
        details.calculatedGrandTotal,
        details.items,
        template.tip,
        template.discount,
        details.calculatedHandlingFee,
        details.calculatedDeliveryFee,
        'COD',
        'Paid'
      );
      
      console.log(`✅ Dummy Order ${i + 1} created: ${result.orderNumber} (Grand Total: AED ${result.totalAmount.toFixed(2)})`);
    }

  } catch(e) {
    console.error('❌ Error creating dummy orders:', e);
  } finally {
    process.exit(0);
  }
}

run();
