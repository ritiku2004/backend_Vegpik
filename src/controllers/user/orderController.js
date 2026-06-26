const { orderModel } = require('../../models');
const { responseHelper } = require('../../utils');
const { notificationService } = require('../../services');

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      shopId, 
      addressId, 
      totalAmount, 
      items, 
      tipAmount, 
      discountAmount, 
      handlingFee, 
      deliveryFee
    } = req.body;

    if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
      return responseHelper.sendError(res, 400, 'Invalid order data');
    }

    // COD Order — created immediately with PENDING payment status
    const orderData = await orderModel.createOrder(
      userId,
      shopId,
      addressId,
      totalAmount,
      items,
      tipAmount,
      discountAmount,
      handlingFee,
      deliveryFee,
      'COD',
      'PENDING'
    );

    // Send notifications (non-blocking)
    notificationService.sendOrderStatus(userId, orderData.orderId, 'placed')
      .catch(notifErr => console.error('Failed to send order placed notification:', notifErr));
    notificationService.sendAdminOrderArrived(orderData.orderId)
      .catch(notifErr => console.error('Failed to send order arrived notification:', notifErr));

    return responseHelper.sendSuccess(res, 201, 'Order created successfully', {
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
      status: orderData.status,
      paymentStatus: 'PENDING',
      paymentMethod: 'COD',
      createdAt: orderData.createdAt,
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    return responseHelper.sendError(res, 500, 'Failed to create order', error);
  }
};

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await orderModel.getOrdersByUserId(userId);
    return responseHelper.sendSuccess(res, 200, 'Orders fetched successfully', orders);
  } catch (error) {
    console.error('Get User Orders Error:', error);
    return responseHelper.sendError(res, 500, 'Failed to fetch orders', error);
  }
};

module.exports = {
  createOrder,
  getUserOrders
};
