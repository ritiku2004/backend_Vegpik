const pool = require('../config/db');
const { getRoadDistanceKm } = require('../services/distanceService');

const getCartByUserId = async (userId, activeShopId = null, activeAddressId = null, guestId = null) => {
  const connection = await pool.getConnection();
  try {
    // Get the active cart
    let carts = [];
    if (userId) {
      [carts] = await connection.query('SELECT * FROM carts WHERE user_id = ?', [userId]);
    } else if (guestId) {
      [carts] = await connection.query('SELECT * FROM carts WHERE guest_id = ?', [guestId]);
    } else {
      return null;
    }
    
    if (carts.length === 0) return null;
    
    const cart = carts[0];

    // Get cart items with product and shop pricing details
    let items = [];
    if (activeShopId) {
      [items] = await connection.query(`
        SELECT ci.*, p.mrp_price as price, p.name, p.brand, p.quantity as size, p.quantity_type, p.image_url, 
               p.discount_percentage, IFNULL(sp.is_available, 1) as is_available
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        LEFT JOIN shop_products sp ON p.id = sp.product_id AND sp.shop_id = ?
        WHERE ci.cart_id = ?
      `, [activeShopId, cart.id]);
    } else {
      [items] = await connection.query(`
        SELECT ci.*, p.mrp_price as price, p.name, p.brand, p.quantity as size, p.quantity_type, p.image_url, 
               p.discount_percentage, 1 as is_available
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = ?
      `, [cart.id]);
    }

    cart.items = items;
    
    // Calculate total price dynamically
    let subtotal = 0;
    let savings = 0;

    items.forEach(item => {
      if (item.is_available) {
        const originalPrice = Number(item.price);
        const discountPercentage = Number(item.discount_percentage || 0);
        const discountPrice = Math.max(0, originalPrice - (originalPrice * (discountPercentage / 100)));
        
        subtotal += discountPrice * item.quantity;
        savings += (originalPrice - discountPrice) * item.quantity;
      }
    });

    // Fetch the system charges configuration
    const [configs] = await connection.query('SELECT * FROM charges_config WHERE id = 1');
    const config = configs[0] || {
      delivery_base_charge: 30.00,
      delivery_distance_rate: 5.00,
      free_delivery_threshold: 300.00,
      handling_fee: 15.00,
      free_handling_threshold: 500.00
    };

    let distance = 0;
    if (activeShopId) {
      const [shops] = await connection.query('SELECT latitude, longitude FROM shops WHERE id = ?', [activeShopId]);
      if (shops.length > 0 && shops[0].latitude && shops[0].longitude) {
        let addressIdToUse = activeAddressId;
        if (!addressIdToUse && userId) {
          const [users] = await connection.query('SELECT default_address_id FROM users WHERE id = ?', [userId]);
          if (users.length > 0 && users[0].default_address_id) {
            addressIdToUse = users[0].default_address_id;
          }
        }

        if (addressIdToUse) {
          const [addresses] = await connection.query('SELECT latitude, longitude FROM user_addresses WHERE id = ?', [addressIdToUse]);
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
    }

    const deliveryFee = subtotal === 0 ? 0 : (subtotal >= Number(config.free_delivery_threshold) ? 0 : (Number(config.delivery_base_charge) + (distance * Number(config.delivery_distance_rate))));
    const handlingFee = subtotal === 0 ? 0 : (subtotal >= Number(config.free_handling_threshold) ? 0 : Number(config.handling_fee));
    const taxAmount = 0; // GST completely removed
    const grandTotal = subtotal + deliveryFee + handlingFee;

    cart.pricing = {
      subtotal: parseFloat(subtotal.toFixed(2)),
      savings: parseFloat(savings.toFixed(2)),
      deliveryFee: parseFloat(deliveryFee.toFixed(2)),
      handlingFee: parseFloat(handlingFee.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      freeDeliveryThreshold: Number(config.free_delivery_threshold),
      freeHandlingThreshold: Number(config.free_handling_threshold),
      distanceKm: parseFloat(distance.toFixed(2))
    };

    return cart;
  } finally {
    connection.release();
  }
};

const getOrCreateCart = async (userId, shopId, guestId = null) => {
  let cart = await getCartByUserId(userId, shopId, null, guestId);
  if (!cart) {
    let result;
    if (userId) {
      [result] = await pool.query('INSERT INTO carts (user_id, shop_id) VALUES (?, ?)', [userId, shopId]);
    } else if (guestId) {
      [result] = await pool.query('INSERT INTO carts (guest_id, shop_id) VALUES (?, ?)', [guestId, shopId]);
    } else {
      throw new Error('Either userId or guestId is required to create a cart');
    }
    cart = { 
      id: result.insertId, 
      user_id: userId,
      guest_id: guestId, 
      items: [], 
      pricing: { subtotal: 0, savings: 0, deliveryFee: 0, handlingFee: 0, grandTotal: 0, freeDeliveryThreshold: 0, freeHandlingThreshold: 0 } 
    };
  }
  return cart;
};

const addItemToCart = async (userId, shopId, productId, quantity, guestId = null) => {
  const cart = await getOrCreateCart(userId, shopId, guestId);

  // Check if item already exists in cart
  const [existingItems] = await pool.query(
    'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?', 
    [cart.id, productId]
  );

  if (existingItems.length > 0) {
    // Update quantity
    const newQty = existingItems[0].quantity + quantity;
    await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?',
      [newQty, cart.id, productId]
    );
  } else {
    // Insert new item
    await pool.query(
      'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
      [cart.id, productId, quantity]
    );
  }

  return await getCartByUserId(userId, shopId, null, guestId);
};

const updateItemQuantity = async (cartItemId, quantity) => {
  if (quantity <= 0) {
    return await removeItemFromCart(cartItemId);
  }
  
  const [result] = await pool.query(
    'UPDATE cart_items SET quantity = ? WHERE id = ?',
    [quantity, cartItemId]
  );
  return result.affectedRows > 0;
};

const removeItemFromCart = async (cartItemId) => {
  const [result] = await pool.query('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
  return result.affectedRows > 0;
};

const clearCart = async (userId, guestId = null) => {
  // Deleting the cart will automatically delete cart_items due to ON DELETE CASCADE
  let result;
  if (userId) {
    [result] = await pool.query('DELETE FROM carts WHERE user_id = ?', [userId]);
  } else if (guestId) {
    [result] = await pool.query('DELETE FROM carts WHERE guest_id = ?', [guestId]);
  }
  return result && result.affectedRows > 0;
};

const mergeCarts = async (userId, guestId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get guest cart
    const [guestCarts] = await connection.query('SELECT * FROM carts WHERE guest_id = ?', [guestId]);
    if (guestCarts.length === 0) {
      await connection.commit();
      return await getCartByUserId(userId);
    }
    const guestCart = guestCarts[0];

    // 2. Get user cart
    const [userCarts] = await connection.query('SELECT * FROM carts WHERE user_id = ?', [userId]);
    
    if (userCarts.length === 0) {
      // User has no cart. Re-assign the guest cart to the user!
      await connection.query('UPDATE carts SET user_id = ?, guest_id = NULL WHERE id = ?', [userId, guestCart.id]);
      await connection.commit();
      return await getCartByUserId(userId);
    }
    const userCart = userCarts[0];

    // 3. User already has a cart. We merge items.
    const [guestItems] = await connection.query('SELECT * FROM cart_items WHERE cart_id = ?', [guestCart.id]);
    const [userItems] = await connection.query('SELECT * FROM cart_items WHERE cart_id = ?', [userCart.id]);

    for (const gItem of guestItems) {
      const existingUserItem = userItems.find(uItem => uItem.product_id === gItem.product_id);
      if (existingUserItem) {
        // Sum quantities
        await connection.query(
          'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
          [gItem.quantity, existingUserItem.id]
        );
      } else {
        // Insert guest item to user's cart
        await connection.query(
          'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
          [userCart.id, gItem.product_id, gItem.quantity]
        );
      }
    }

    // 4. Delete the guest cart
    await connection.query('DELETE FROM carts WHERE id = ?', [guestCart.id]);

    await connection.commit();
    return await getCartByUserId(userId);
  } catch (error) {
    await connection.rollback();
    console.error('Merge carts transaction failed:', error);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getCartByUserId,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
  mergeCarts
};
