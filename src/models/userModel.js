const pool = require('../config/db');

const getUserByPhone = async (phone) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE phone_number = ?', [phone]);
  return rows[0];
};

const getUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

const getUserById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0];
};

const createUser = async (userData) => {
  const { email, phone_number, first_name, last_name } = userData;

  // Dynamically build INSERT to avoid passing NULL into a formerly NOT NULL column
  if (phone_number) {
    const [result] = await pool.query(
      'INSERT INTO users (email, phone_number, first_name, last_name) VALUES (?, ?, ?, ?)',
      [email || null, phone_number, first_name || null, last_name || null]
    );
    return result.insertId;
  } else {
    // Email-only registration (no phone number)
    const [result] = await pool.query(
      'INSERT INTO users (email, first_name, last_name) VALUES (?, ?, ?)',
      [email || null, first_name || null, last_name || null]
    );
    return result.insertId;
  }
};

const getAllUsers = async () => {
  const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  return rows;
};

const deleteUser = async (id) => {
  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

const updateUserName = async (id, firstName, lastName) => {
  const [result] = await pool.query(
    'UPDATE users SET first_name = ?, last_name = ? WHERE id = ?',
    [firstName, lastName, id]
  );
  return result.affectedRows > 0;
};

const updateUserProfile = async (id, firstName, lastName, email, phone_number, profilePictureUrl) => {
  // Fetch existing user to preserve profile_picture_url and email if not provided
  const [existingUserRows] = await pool.query('SELECT email, profile_picture_url FROM users WHERE id = ?', [id]);
  const existingUser = existingUserRows[0] || {};
  
  const finalEmail = email !== undefined ? (email || null) : existingUser.email;
  const finalProfilePic = profilePictureUrl !== undefined ? (profilePictureUrl || null) : existingUser.profile_picture_url;

  const [result] = await pool.query(
    'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone_number = ?, profile_picture_url = ? WHERE id = ?',
    [firstName, lastName, finalEmail, phone_number || null, finalProfilePic, id]
  );
  return result.affectedRows > 0;
};

const getUserDetailsById = async (id) => {
  // Get User Basic Info
  const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  const user = userRows[0];
  
  if (!user) return null;

  // Get User Addresses
  const [addressRows] = await pool.query('SELECT * FROM user_addresses WHERE user_id = ?', [id]);
  
  // Get User Orders
  const [orderRows] = await pool.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [id]);
  
  // For each order, fetch items with original MRP prices
  const orders = await Promise.all(orderRows.map(async (order) => {
    const [itemRows] = await pool.query(`
      SELECT oi.*, p.mrp_price, p.image_url 
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [order.id]);
    return { ...order, items: itemRows };
  }));

  // Get Cart Items
  const [cartRows] = await pool.query('SELECT * FROM carts WHERE user_id = ?', [id]);
  let cartItems = [];
  if (cartRows.length > 0) {
    const cartId = cartRows[0].id;
    const [items] = await pool.query(`
      SELECT ci.*, p.name as product_name, p.image_url, p.mrp_price as price 
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
    `, [cartId]);
    cartItems = items;
  }

  return {
    profile: user,
    addresses: addressRows,
    orders,
    cartItems
  };
};

const getUserAddresses = async (userId) => {
  const [rows] = await pool.query('SELECT * FROM user_addresses WHERE user_id = ? AND is_deleted = 0', [userId]);
  return rows;
};

const saveUserAddress = async (userId, addressData) => {
  const { title, address_line1, address_line2, city, state, latitude, longitude, is_default, receiver_name, receiver_mobile } = addressData;
  const cleanTitle = (title || 'Other').trim();
  const validTitles = ['Home', 'Office', 'Other'];
  if (!validTitles.includes(cleanTitle)) {
    throw new Error('Invalid address type. Must be Home, Office, or Other');
  }

  const [existing] = await pool.query(
    'SELECT id FROM user_addresses WHERE user_id = ? AND title = ? AND is_deleted = 0',
    [userId, cleanTitle]
  );

  if (existing.length > 0) {
    const addressId = existing[0].id;
    // Soft delete the old address of the same type to keep historical order references intact
    await pool.query(
      'UPDATE user_addresses SET is_deleted = 1, is_default = 0 WHERE id = ?',
      [addressId]
    );
  }

  // Always insert a new record so that past orders pointing to the old address are not affected
  const [result] = await pool.query(
    'INSERT INTO user_addresses (user_id, title, address_line1, address_line2, city, state, latitude, longitude, is_default, receiver_name, receiver_mobile) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      userId,
      cleanTitle,
      address_line1,
      address_line2 || null,
      city || 'City',
      state || 'Emirate',
      latitude || null,
      longitude || null,
      is_default || false,
      receiver_name || null,
      receiver_mobile || null
    ]
  );
  return result.insertId;
};

const deleteUserAddress = async (userId, addressId) => {
  const [addressRows] = await pool.query(
    'SELECT is_default FROM user_addresses WHERE user_id = ? AND id = ?',
    [userId, addressId]
  );

  const [result] = await pool.query(
    'UPDATE user_addresses SET is_deleted = 1, is_default = 0 WHERE user_id = ? AND id = ?',
    [userId, addressId]
  );

  if (result.affectedRows > 0) {
    if (addressRows.length > 0 && addressRows[0].is_default) {
      await pool.query(
        'UPDATE users SET default_address_id = NULL WHERE id = ?',
        [userId]
      );
    }
    return true;
  }
  return false;
};

const updateUserProfilePicture = async (id, profilePictureUrl) => {
  const [result] = await pool.query(
    'UPDATE users SET profile_picture_url = ? WHERE id = ?',
    [profilePictureUrl, id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  getUserByPhone,
  getUserByEmail,
  getUserById,
  createUser,
  getAllUsers,
  deleteUser,
  updateUserName,
  updateUserProfile,
  updateUserProfilePicture,
  getUserDetailsById,
  getUserAddresses,
  saveUserAddress,
  deleteUserAddress
};
