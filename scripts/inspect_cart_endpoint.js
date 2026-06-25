require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { getCart } = require('../src/controllers/user/cartController');

async function run() {
  const req = {
    query: {
      userId: 7,
      shopId: 4,
      addressId: 'addr1'
    }
  };

  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(body) {
      console.log('Status Code:', this.statusCode || 200);
      console.log('Response Body:', JSON.stringify(body, null, 2));
    }
  };

  try {
    await getCart(req, res);
    process.exit(0);
  } catch (err) {
    console.error('Controller call threw:', err);
    process.exit(1);
  }
}

run();
