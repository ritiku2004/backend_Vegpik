const { orderModel } = require('../../models');
const { notificationService } = require('../../services');

const getOrders = async (req, res) => {
  try {
    const { shopId } = req.query;
    let orders;
    if (shopId) {
      orders = await orderModel.getOrdersByShopId(shopId);
    } else {
      orders = await orderModel.getAllOrders();
    }
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await orderModel.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, payment_status } = req.body;
    const orderId = req.params.id;
    
    // Fetch order first to get userId
    const order = await orderModel.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const success = await orderModel.updateOrderStatus(orderId, status, payment_status);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Order not found or update failed' });
    }

    // Map the admin status selection to user notification status
    // Status mappings from admin frontend dashboard could be "Delivered", "Cancelled", "On the Way", "Processing", etc.
    const normalizedStatus = status.toLowerCase().replace(/ /g, '_');
    
    notificationService.sendOrderStatus(order.user_id, orderId, normalizedStatus)
      .catch(notifErr => console.error('Failed to send status update notification:', notifErr));

    res.status(200).json({ success: true, message: 'Order updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus
};
