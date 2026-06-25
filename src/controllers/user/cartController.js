const { cartModel, userModel } = require('../../models');
const { responseHelper } = require('../../utils');

const isValidGuestId = (guestId) => {
  return typeof guestId === 'string' && /^guest_[a-zA-Z0-9_-]+$/.test(guestId);
};

const resolveUserId = async (userId) => {
  if (typeof userId === 'string' && userId.startsWith('mock_user_')) {
    const phone = userId.replace('mock_user_', '');
    const email = `${phone}@freshsabjihub.com`;
    let user = await userModel.getUserByPhone(phone);
    if (!user) {
      user = await userModel.getUserByEmail(email);
    }
    if (!user) {
      const newUserId = await userModel.createUser({
        email,
        phone_number: phone,
        first_name: 'Guest',
        last_name: 'User'
      });
      user = await userModel.getUserById(newUserId);
    }
    return user.id;
  }
  return userId;
};

const getCart = async (req, res) => {
  try {
    let userId = req.user ? req.user.id : (req.query.userId || (req.body && req.body.userId));
    const guestId = req.query.guestId || (req.body && req.body.guestId);
    
    userId = await resolveUserId(userId);
    
    if (!userId && !guestId) {
      return responseHelper.sendError(res, 400, 'User ID or Guest ID is required');
    }

    if (guestId && !isValidGuestId(guestId)) {
      return responseHelper.sendError(res, 400, 'Invalid guestId format');
    }

    const shopId = req.query.shopId;
    const addressId = req.query.addressId;

    let cart = await cartModel.getCartByUserId(userId, shopId, addressId, guestId);
    if (!cart) {
      cart = { 
        user_id: userId || null, 
        guest_id: guestId || null,
        items: [], 
        pricing: { subtotal: 0, savings: 0, deliveryFee: 0, handlingFee: 0, grandTotal: 0, freeDeliveryThreshold: 0, freeHandlingThreshold: 0 }
      };
    }

    return responseHelper.sendSuccess(res, 200, 'Cart fetched successfully', cart);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to fetch cart', error);
  }
};

const addItem = async (req, res) => {
  try {
    let userId = req.user ? req.user.id : (req.body && req.body.userId);
    const guestId = req.body && req.body.guestId;
    const { shopId, productId, quantity } = req.body;

    userId = await resolveUserId(userId);

    if ((!userId && !guestId) || !shopId || !productId || !quantity) {
      return responseHelper.sendError(res, 400, 'userId or guestId, shopId, productId, and quantity are required');
    }


    if (guestId && !isValidGuestId(guestId)) {
      return responseHelper.sendError(res, 400, 'Invalid guestId format');
    }

    if (userId) {
      // Verify user exists to prevent foreign key constraint error
      const userExists = await userModel.getUserById(userId);
      if (!userExists) {
        return responseHelper.sendError(res, 404, 'User not found. Please log out and log in again.');
      }
    }

    const updatedCart = await cartModel.addItemToCart(userId, shopId, productId, quantity, guestId);
    return responseHelper.sendSuccess(res, 200, 'Item added to cart', updatedCart);
  } catch (error) {
    console.error("ADD ITEM ERROR: ", error);
    return responseHelper.sendError(res, 500, 'Failed to add item to cart', error ? error.message : 'Unknown error');
  }
};

const updateItem = async (req, res) => {
  try {
    const itemId = req.params.itemId || req.body.itemId;
    const { quantity } = req.body;

    if (itemId === undefined || quantity === undefined) {
      return responseHelper.sendError(res, 400, 'itemId and quantity are required');
    }

    const success = await cartModel.updateItemQuantity(itemId, quantity);
    if (!success) {
      return responseHelper.sendError(res, 404, 'Cart item not found');
    }

    return responseHelper.sendSuccess(res, 200, 'Cart item updated successfully');
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to update cart item', error);
  }
};

const removeItem = async (req, res) => {
  try {
    const itemId = req.params.itemId || req.body.itemId || req.query.itemId;
    if (!itemId) {
      return responseHelper.sendError(res, 400, 'itemId is required');
    }
    const success = await cartModel.removeItemFromCart(itemId);
    if (!success) {
      return responseHelper.sendError(res, 404, 'Cart item not found');
    }

    return responseHelper.sendSuccess(res, 200, 'Cart item removed successfully');
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to remove cart item', error);
  }
};

const clearCart = async (req, res) => {
  try {
    let userId = req.user ? req.user.id : (req.query.userId || (req.body && req.body.userId));
    const guestId = req.query.guestId || (req.body && req.body.guestId);
    
    userId = await resolveUserId(userId);

    if (!userId && !guestId) {
      return responseHelper.sendError(res, 400, 'User ID or Guest ID is required');
    }

    if (guestId && !isValidGuestId(guestId)) {
      return responseHelper.sendError(res, 400, 'Invalid guestId format');
    }

    await cartModel.clearCart(userId, guestId);
    return responseHelper.sendSuccess(res, 200, 'Cart cleared successfully');
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to clear cart', error);
  }
};

const mergeCarts = async (req, res) => {
  try {
    let { userId, guestId } = req.body;
    if (!userId || !guestId) {
      return responseHelper.sendError(res, 400, 'userId and guestId are required');
    }

    if (!isValidGuestId(guestId)) {
      return responseHelper.sendError(res, 400, 'Invalid guestId format');
    }

    userId = await resolveUserId(userId);

    const userExists = await userModel.getUserById(userId);
    if (!userExists) {
      return responseHelper.sendError(res, 404, 'User not found');
    }

    const mergedCart = await cartModel.mergeCarts(userId, guestId);
    return responseHelper.sendSuccess(res, 200, 'Carts merged successfully', mergedCart);
  } catch (error) {
    console.error('Merge Carts Error:', error);
    return responseHelper.sendError(res, 500, 'Failed to merge carts', error ? error.message : 'Unknown error');
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  mergeCarts
};
