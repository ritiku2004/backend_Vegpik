const firebase = require('../config/firebase');
const { deviceTokenModel, notificationModel } = require('../models');

const sendMulticast = async (tokens, notification, data = {}) => {
  if (!tokens || tokens.length === 0) return;
  
  // Clean tokens from duplicates
  const uniqueTokens = [...new Set(tokens)];

  try {
    if (firebase.messaging) {
      // Create message array for each token
      const messages = uniqueTokens.map(token => ({
        token,
        notification,
        data
      }));
      
      const response = await firebase.messaging.sendEach(messages);
      console.log(`Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`);
      
      // Clean up invalid tokens if any failed
      if (response.failureCount > 0) {
        response.responses.forEach(async (resp, idx) => {
          if (!resp.success) {
            const errCode = resp.error?.code;
            if (errCode === 'messaging/invalid-registration-token' || errCode === 'messaging/registration-token-not-registered') {
              console.log(`Removing invalid token: ${uniqueTokens[idx]}`);
              await deviceTokenModel.deleteToken(uniqueTokens[idx]);
            }
          }
        });
      }
    } else {
      console.warn('Firebase Admin Messaging not initialized.');
    }
  } catch (error) {
    console.error('Error sending multicast message:', error);
  }
};

const sendOrderStatus = async (userId, orderId, status) => {
  try {
    const titleMap = {
      placed: 'Order Placed successfully!',
      processing: 'Order Confirmed! 🛒',
      shipped: 'Your Order is on the Way!',
      on_the_way: 'Your Order is on the Way!',
      delivered: 'Order Delivered 🎉',
      cancelled: 'Order Cancelled ❌'
    };

    const bodyMap = {
      placed: `Your order #${orderId} has been successfully placed. We will deliver it soon.`,
      processing: `Your order #${orderId} has been confirmed and is being prepared.`,
      shipped: `Your order #${orderId} is out for delivery. Keep your phone handy!`,
      on_the_way: `Your order #${orderId} is out for delivery. Keep your phone handy!`,
      delivered: `Your order #${orderId} has been delivered. Thank you for shopping with us!`,
      cancelled: `Your order #${orderId} has been cancelled.`
    };

    const title = titleMap[status] || 'Order Update';
    const body = bodyMap[status] || `Your order #${orderId} status has changed to ${status}.`;

    const data = {
      orderId: String(orderId),
      status: String(status),
      type: 'order_status'
    };

    // Save notification to database first
    let notificationId = null;
    try {
      notificationId = await notificationModel.createNotification(userId, title, body, 'order_status', data);
      if (notificationId) {
        data.notificationId = String(notificationId);
      }
    } catch (dbErr) {
      console.error('Error saving order status notification to DB:', dbErr);
    }

    const tokens = await deviceTokenModel.getTokensByUser(userId);
    if (tokens.length === 0) {
      console.log(`No device tokens registered for user ID: ${userId}. Saved to DB history only.`);
      return;
    }

    const notification = { title, body };
    await sendMulticast(tokens, notification, data);
  } catch (error) {
    console.error('Error in sendOrderStatus notification:', error);
  }
};

const sendAdminOrderArrived = async (orderId) => {
  try {
    const tokens = await deviceTokenModel.getAdminTokens();
    if (tokens.length === 0) return;

    const notification = {
      title: 'New Order Received! 🛒',
      body: `A new order #${orderId} has been placed and requires processing.`
    };

    const data = {
      orderId: String(orderId),
      type: 'new_order'
    };

    await sendMulticast(tokens, notification, data);
  } catch (error) {
    console.error('Error in sendAdminOrderArrived notification:', error);
  }
};

const sendWelcomeNotification = async (userId) => {
  try {
    const title = 'Welcome to Fresh Sabji Hub! 🥬';
    const body = 'Get fresh farm-to-table groceries delivered straight to your doorstep.';
    const data = {
      type: 'welcome'
    };

    // Save to database first
    let notificationId = null;
    try {
      notificationId = await notificationModel.createNotification(userId, title, body, 'welcome', data);
      if (notificationId) {
        data.notificationId = String(notificationId);
      }
    } catch (dbErr) {
      console.error('Error saving welcome notification to DB:', dbErr);
    }

    const tokens = await deviceTokenModel.getTokensByUser(userId);
    if (tokens.length === 0) {
      console.log(`No device tokens registered yet for user ID: ${userId}. Saved to DB history only.`);
      return;
    }

    const notification = { title, body };
    await sendMulticast(tokens, notification, data);
    console.log(`Successfully sent welcome notification to user ID: ${userId}`);
  } catch (error) {
    console.error('Error in sendWelcomeNotification:', error);
  }
};

module.exports = {
  sendOrderStatus,
  sendAdminOrderArrived,
  sendWelcomeNotification
};
