const Razorpay = require('razorpay');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_Dq94dK40f8K201', // Dev placeholder key ID
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret_placeholder_12345'
});

module.exports = razorpay;
