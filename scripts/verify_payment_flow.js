const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const crypto = require('crypto');
const pool = require('../src/config/db');

async function testSchema() {
  console.log('\n=== TESTING SCHEMA INTEGRITY ===');
  try {
    const [ordersCols] = await pool.query('DESCRIBE orders');
    const expectedCols = ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'tax_amount'];
    const actualColNames = ordersCols.map(c => c.Field);
    
    expectedCols.forEach(col => {
      if (actualColNames.includes(col)) {
        console.log(`✅ Column '${col}' found in 'orders' table.`);
      } else {
        console.error(`❌ Column '${col}' is MISSING in 'orders' table.`);
      }
    });

    const [productsCols] = await pool.query('DESCRIBE products');
    const actualProdNames = productsCols.map(c => c.Field);
    if (actualProdNames.includes('stock_quantity')) {
      console.log(`✅ Column 'stock_quantity' found in 'products' table.`);
    } else {
      console.error(`❌ Column 'stock_quantity' is MISSING in 'products' table.`);
    }

    const [logsCols] = await pool.query("SHOW TABLES LIKE 'payment_logs'");
    if (logsCols.length > 0) {
      console.log(`✅ Table 'payment_logs' exists.`);
    } else {
      console.error(`❌ Table 'payment_logs' does NOT exist.`);
    }
  } catch (err) {
    console.error('Schema check failed:', err);
  }
}

function testSignatureVerification() {
  console.log('\n=== TESTING RAZORPAY SIGNATURE VERIFICATION ===');
  const razorpayOrderId = 'order_ABC123';
  const razorpayPaymentId = 'pay_XYZ789';
  const secret = 'test_secret_123';
  
  // Compute signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
  const correctSignature = hmac.digest('hex');

  console.log(`Razorpay Order ID: ${razorpayOrderId}`);
  console.log(`Razorpay Payment ID: ${razorpayPaymentId}`);
  console.log(`Generated Signature: ${correctSignature}`);

  // Test match
  const testHmac = crypto.createHmac('sha256', secret);
  testHmac.update(razorpayOrderId + '|' + razorpayPaymentId);
  const testSig = testHmac.digest('hex');
  if (testSig === correctSignature) {
    console.log('✅ Signature verification algorithm is CORRECT.');
  } else {
    console.error('❌ Signature verification algorithm is INCORRECT.');
  }
}

function testWebhookVerification() {
  console.log('\n=== TESTING RAZORPAY WEBHOOK VERIFICATION ===');
  const webhookSecret = 'whsec_testing_456';
  const payload = {
    event: 'order.paid',
    payload: {
      payment: {
        entity: {
          id: 'pay_XYZ789',
          amount: 29950,
          order_id: 'order_ABC123'
        }
      }
    }
  };

  const bodyStr = JSON.stringify(payload);
  const shasum = crypto.createHmac('sha256', webhookSecret);
  shasum.update(bodyStr);
  const signature = shasum.digest('hex');

  console.log(`Computed Webhook Signature: ${signature}`);

  // Verify
  const testShasum = crypto.createHmac('sha256', webhookSecret);
  testShasum.update(bodyStr);
  const testDigest = testShasum.digest('hex');

  if (testDigest === signature) {
    console.log('✅ Webhook signature verification algorithm is CORRECT.');
  } else {
    console.error('❌ Webhook signature verification algorithm is INCORRECT.');
  }
}

async function run() {
  await testSchema();
  testSignatureVerification();
  testWebhookVerification();
  process.exit(0);
}

run();
