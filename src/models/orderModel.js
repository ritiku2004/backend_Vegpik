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
  const calculatedTaxAmount = 0; // Tax disabled — UAE VAT not applicable
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
  paymentStatus = 'PENDING'
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
          status, payment_status, payment_method, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

module.exports = {
  getAllOrders,
  getOrderById,
  getOrdersByShopId,
  updateOrderStatus,
  createOrder,
  getOrdersByUserId,
  calculateOrderDetails
};
