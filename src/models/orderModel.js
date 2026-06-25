const pool = require('../config/db');
const { getRoadDistanceKm } = require('../services/distanceService');

const getAllOrders = async () => {
  const [rows] = await pool.query(`
    SELECT o.*, u.first_name, u.last_name, s.name as shop_name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN shops s ON o.shop_id = s.id
    ORDER BY o.created_at DESC
  `);
  return rows;
};

const getOrderById = async (id) => {
  const isOrderNumber = typeof id === 'string' && id.startsWith('ORD');
  const queryField = isOrderNumber ? 'o.order_number' : 'o.id';

  const [rows] = await pool.query(`
    SELECT o.*, u.first_name, u.last_name, u.phone_number as user_phone, s.name as shop_name,
           a.address_line1, a.address_line2, a.city, a.state,
           a.receiver_name, a.receiver_mobile, a.latitude, a.longitude
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN shops s ON o.shop_id = s.id
    LEFT JOIN user_addresses a ON o.address_id = a.id
    WHERE ${queryField} = ?
  `, [id]);
  
  if (rows.length === 0) return null;
  const order = rows[0];

  const [items] = await pool.query(`
    SELECT oi.*, p.mrp_price, p.image_url 
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `, [order.id]);
  order.items = items;

  const [logs] = await pool.query(`
    SELECT * FROM payment_logs WHERE order_id = ? ORDER BY created_at DESC
  `, [order.id]);
  order.payment_logs = logs;

  return order;
};

const getOrdersByShopId = async (shopId) => {
  const [rows] = await pool.query(`
    SELECT o.*, u.first_name, u.last_name 
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.shop_id = ?
    ORDER BY o.created_at DESC
  `, [shopId]);
  return rows;
};

const updateOrderStatus = async (id, status, payment_status) => {
  const [result] = await pool.query(
    'UPDATE orders SET status = ?, payment_status = ? WHERE id = ?',
    [status, payment_status, id]
  );
  return result.affectedRows > 0;
};

const calculateOrderDetails = async (userId, shopId, addressId, items, tipAmount = 0, discountAmount = 0) => {
  // 1. Fetch address details to use for distance calculations using general pool query
  let addressIdToUse = addressId;
  if (!addressIdToUse) {
    const [users] = await pool.query('SELECT default_address_id FROM users WHERE id = ?', [userId]);
    if (users.length > 0 && users[0].default_address_id) {
      addressIdToUse = users[0].default_address_id;
    }
  }

  let distance = 0;
  if (shopId && addressIdToUse) {
    const [shops] = await pool.query('SELECT latitude, longitude FROM shops WHERE id = ?', [shopId]);
    if (shops.length > 0 && shops[0].latitude && shops[0].longitude) {
      const [addresses] = await pool.query('SELECT latitude, longitude FROM user_addresses WHERE id = ?', [addressIdToUse]);
      if (addresses.length > 0 && addresses[0].latitude && addresses[0].longitude) {
        distance = await getRoadDistanceKm(
          parseFloat(shops[0].latitude), 
          parseFloat(shops[0].longitude),
          parseFloat(addresses[0].latitude),
          parseFloat(addresses[0].longitude)
        );
      }
    }
  }

  // 2. Fetch the charges config using general pool query
  const [configs] = await pool.query('SELECT * FROM charges_config WHERE id = 1');
  const config = configs[0] || {
    delivery_base_charge: 30.00,
    delivery_distance_rate: 5.00,
    free_delivery_threshold: 300.00,
    handling_fee: 15.00,
    free_handling_threshold: 500.00
  };

  // 3. Fetch product details for items to compute correct subtotal using general pool query
  let subtotal = 0;
  const itemIds = items.map(item => {
    const rawId = item.productId || item.id;
    if (typeof rawId === 'string' && rawId.startsWith('p')) {
      return parseInt(rawId.substring(1), 10);
    }
    return parseInt(rawId, 10);
  });
  
  const processedItems = JSON.parse(JSON.stringify(items)); // Deep copy to prevent modifying original parameters

  if (itemIds.length > 0) {
    const [dbProducts] = await pool.query(
      'SELECT id, name, mrp_price, discount_percentage FROM products WHERE id IN (?)', 
      [itemIds]
    );
    
    const productMap = {};
    dbProducts.forEach(p => {
      productMap[p.id] = p;
    });

    for (const item of processedItems) {
      let prodId = item.productId || item.id;
      if (typeof prodId === 'string' && prodId.startsWith('p')) {
        prodId = parseInt(prodId.substring(1), 10);
      } else {
        prodId = parseInt(prodId, 10);
      }
      const dbProduct = productMap[prodId];
      if (dbProduct) {
        item.name = dbProduct.name;
        const originalPrice = Number(dbProduct.mrp_price);
        const discountPercentage = Number(dbProduct.discount_percentage || 0);
        const discountPrice = Math.max(0, originalPrice - (originalPrice * (discountPercentage / 100)));
        item.price = discountPrice; // use discounted price for transaction
        subtotal += discountPrice * item.quantity;
      }
    }
  }

  // 4. Calculate final fees, tax and grand total
  const calculatedDeliveryFee = subtotal === 0 ? 0 : (subtotal >= Number(config.free_delivery_threshold) ? 0 : (Number(config.delivery_base_charge) + (distance * Number(config.delivery_distance_rate))));
  const calculatedHandlingFee = subtotal === 0 ? 0 : (subtotal >= Number(config.free_handling_threshold) ? 0 : Number(config.handling_fee));
  const calculatedTaxAmount = 0; // GST completely removed
  const calculatedGrandTotal = subtotal + calculatedDeliveryFee + calculatedHandlingFee + (Number(tipAmount) || 0) - (Number(discountAmount) || 0);

  return {
    subtotal,
    distance,
    config,
    items: processedItems,
    calculatedDeliveryFee,
    calculatedHandlingFee,
    calculatedTaxAmount,
    calculatedGrandTotal,
    addressIdToUse
  };
};

const createOrder = async (
  userId, 
  shopId, 
  addressId, 
  totalAmount, 
  items, 
  tipAmount = 0, 
  discountAmount = 0, 
  handlingFee = 0, 
  deliveryFee = 0, 
  paymentMethod = 'COD', 
  paymentStatus = 'PENDING',
  razorpayPaymentId = null,
  razorpayOrderId = null,
  razorpaySignature = null
) => {
  try {
    const details = await calculateOrderDetails(userId, shopId, addressId, items, tipAmount, discountAmount);

    const orderNumber = 'ORD' + Math.floor(100000 + Math.random() * 900000);
    const now = new Date();
    const initialStatus = 'Placed'; // Since order creation only happens once payment is complete (online) or accepted (COD)
    
    // Connect and run quick transaction for SQL insertions, inventory reduction, and cart deletion
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [orderResult] = await connection.query(
        `INSERT INTO orders (
          order_number, user_id, shop_id, address_id, total_amount, 
          tip_amount, discount_amount, handling_fee, delivery_fee, tax_amount, 
          status, payment_status, payment_method, razorpay_payment_id, razorpay_order_id, 
          razorpay_signature, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber, 
          userId, 
          shopId, 
          details.addressIdToUse || null, 
          parseFloat(details.calculatedGrandTotal.toFixed(2)), 
          Number(tipAmount) || 0, 
          Number(discountAmount) || 0, 
          parseFloat(details.calculatedHandlingFee.toFixed(2)), 
          parseFloat(details.calculatedDeliveryFee.toFixed(2)), 
          parseFloat(details.calculatedTaxAmount.toFixed(2)),
          initialStatus, 
          paymentStatus,
          paymentMethod,
          razorpayPaymentId,
          razorpayOrderId,
          razorpaySignature,
          now
        ]
      );
      const orderId = orderResult.insertId;

      for (const item of details.items) {
        let pId = item.productId || item.id;
        if (typeof pId === 'string' && pId.startsWith('p')) {
          pId = parseInt(pId.substring(1), 10);
        } else {
          pId = parseInt(pId, 10);
        }
        await connection.query(
          'INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)',
          [orderId, pId, item.name || item.product_name, item.quantity, item.price]
        );

        // Decrement stock_quantity in products table
        await connection.query(
          'UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ?',
          [item.quantity, pId]
        );
      }

      // Clear the user's cart
      await connection.query('DELETE FROM carts WHERE user_id = ?', [userId]);

      await connection.commit();
      
      return { orderId, orderNumber, totalAmount: details.calculatedGrandTotal, createdAt: now.toISOString(), status: initialStatus };
    } catch (txError) {
      console.error('Create Order Transaction Error:', txError);
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      throw txError;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create Order Model Exception:', error);
    throw error;
  }
};

const getOrdersByUserId = async (userId) => {
  const [rows] = await pool.query(`
    SELECT o.*, s.name as shop_name,
           a.address_line1, a.address_line2, a.city, a.state, a.receiver_name, a.receiver_mobile, a.title as address_title
    FROM orders o
    JOIN shops s ON o.shop_id = s.id
    LEFT JOIN user_addresses a ON o.address_id = a.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `, [userId]);

  const orders = await Promise.all(rows.map(async (order) => {
    const [itemRows] = await pool.query(`
      SELECT oi.*, p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [order.id]);
    return { ...order, items: itemRows };
  }));

  return orders;
};

const updateRazorpayOrderId = async (orderId, razorpayOrderId) => {
  const isOrderNumber = typeof orderId === 'string' && orderId.startsWith('ORD');
  const queryField = isOrderNumber ? 'order_number' : 'id';
  const [result] = await pool.query(
    `UPDATE orders SET razorpay_order_id = ? WHERE ${queryField} = ?`,
    [razorpayOrderId, orderId]
  );
  return result.affectedRows > 0;
};

const verifyAndConfirmPayment = async (orderId, paymentId, signature) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const isOrderNumber = typeof orderId === 'string' && orderId.startsWith('ORD');
    const queryField = isOrderNumber ? 'order_number' : 'id';

    // Lock row to prevent race conditions & duplicate payment operations
    const [orders] = await connection.query(
      `SELECT * FROM orders WHERE ${queryField} = ? FOR UPDATE`,
      [orderId]
    );

    if (orders.length === 0) {
      throw new Error('Order not found');
    }

    const order = orders[0];

    // If order is already paid, commit and return immediately (idempotency check)
    if (order.payment_status === 'Paid') {
      await connection.commit();
      return { success: true, alreadyPaid: true, order };
    }

    // Update the order details using exact database integer id
    await connection.query(
      'UPDATE orders SET status = ?, payment_status = ?, razorpay_payment_id = ?, razorpay_signature = ? WHERE id = ?',
      ['Placed', 'Paid', paymentId, signature, order.id]
    );

    // Fetch items to reduce inventory using exact database integer id
    const [items] = await connection.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [order.id]
    );

    // Decrement stock_quantity in products table
    for (const item of items) {
      await connection.query(
        'UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Clear the user's cart on successful payment confirmation
    await connection.query('DELETE FROM carts WHERE user_id = ?', [order.user_id]);

    await connection.commit();
    return { 
      success: true, 
      alreadyPaid: false, 
      order: { 
        ...order, 
        status: 'Processing', 
        payment_status: 'Paid', 
        razorpay_payment_id: paymentId, 
        razorpay_signature: signature 
      } 
    };
  } catch (error) {
    console.error('Original Payment Verification Transaction Error:', error);
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
    throw error;
  } finally {
    connection.release();
  }
};

const recordPaymentLog = async (orderId, razorpayOrderId, razorpayPaymentId, eventType, payload) => {
  let dbOrderId = orderId;
  if (typeof orderId === 'string' && orderId.startsWith('ORD')) {
    const [rows] = await pool.query('SELECT id FROM orders WHERE order_number = ?', [orderId]);
    if (rows.length > 0) {
      dbOrderId = rows[0].id;
    }
  }
  const [result] = await pool.query(
    'INSERT INTO payment_logs (order_id, razorpay_order_id, razorpay_payment_id, event_type, payload) VALUES (?, ?, ?, ?, ?)',
    [
      dbOrderId, 
      razorpayOrderId, 
      razorpayPaymentId, 
      eventType, 
      typeof payload === 'string' ? payload : JSON.stringify(payload)
    ]
  );
  return result.insertId;
};

const getPaymentLogsByOrderId = async (orderId) => {
  const isOrderNumber = typeof orderId === 'string' && orderId.startsWith('ORD');
  const queryField = isOrderNumber ? 'order_number' : 'id';
  
  const [rows] = await pool.query(`
    SELECT pl.* FROM payment_logs pl
    JOIN orders o ON pl.order_id = o.id
    WHERE o.${queryField} = ?
    ORDER BY pl.created_at DESC
  `, [orderId]);
  return rows;
};

const getOrderByRazorpayOrderId = async (razorpayOrderId) => {
  const [rows] = await pool.query('SELECT * FROM orders WHERE razorpay_order_id = ?', [razorpayOrderId]);
  return rows.length > 0 ? rows[0] : null;
};

module.exports = {
  getAllOrders,
  getOrderById,
  getOrdersByShopId,
  updateOrderStatus,
  createOrder,
  getOrdersByUserId,
  updateRazorpayOrderId,
  verifyAndConfirmPayment,
  recordPaymentLog,
  getPaymentLogsByOrderId,
  getOrderByRazorpayOrderId,
  calculateOrderDetails
};
