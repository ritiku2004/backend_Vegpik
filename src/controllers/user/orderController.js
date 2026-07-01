const { orderModel } = require('../../models');
const { responseHelper } = require('../../utils');
const { notificationService } = require('../../services');

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('[DEBUG] createOrder headers:', req.headers);
    console.log('[DEBUG] createOrder body:', req.body);
    const { 
      shopId, 
      addressId, 
      totalAmount, 
      tipAmount, 
      discountAmount, 
      handlingFee, 
      deliveryFee,
      paymentMethod = 'COD',
      transactionId,
      userBankName,
      userBankAccount,
      userBankIban
    } = req.body;
    
    console.log('[DEBUG] Extracted paymentMethod:', paymentMethod);

    let items = req.body.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        return responseHelper.sendError(res, 400, 'Invalid items format');
      }
    }

    if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
      return responseHelper.sendError(res, 400, 'Invalid order data');
    }

    let paymentScreenshotUrl = null;
    if (req.file) {
      const { ipHelper } = require('../../utils');
      paymentScreenshotUrl = ipHelper.getFormattedUrl(req, req.file);
    }

    let initialPaymentStatus = 'PENDING';
    if (paymentMethod === 'PayPal' || paymentMethod === 'Bank Transfer') {
      initialPaymentStatus = 'PENDING'; // Admin needs to verify
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
      paymentMethod,
      initialPaymentStatus,
      paymentScreenshotUrl,
      transactionId,
      userBankName,
      userBankAccount,
      userBankIban
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
      paymentStatus: initialPaymentStatus,
      paymentMethod: paymentMethod,
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

const getOrderReceipt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    
    const order = await orderModel.getOrderById(orderId);
    if (!order || order.user_id !== userId) {
      return responseHelper.sendError(res, 404, 'Order not found');
    }
    
    const { receiptService } = require('../../services');
    const htmlContent = receiptService.generateHtmlReceipt(order);
    
    return res.json({
      success: true,
      html: htmlContent
    });
  } catch (error) {
    console.error('Get Order Receipt Error:', error);
    return responseHelper.sendError(res, 500, 'Failed to fetch receipt', error);
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderReceipt
};
