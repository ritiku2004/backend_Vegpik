const { notificationModel } = require('../../models');
const { responseHelper } = require('../../utils');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await notificationModel.getNotificationsByUser(userId);
    return responseHelper.sendSuccess(res, 200, 'Notifications retrieved successfully.', notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return responseHelper.sendError(res, 500, 'Failed to fetch notifications.', error);
  }
};

const markRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id, 10);
    
    if (isNaN(notificationId)) {
      return responseHelper.sendError(res, 400, 'Invalid notification ID.');
    }

    const success = await notificationModel.markAsRead(notificationId, userId);
    if (!success) {
      return responseHelper.sendError(res, 404, 'Notification not found or not owned by user.');
    }

    return responseHelper.sendSuccess(res, 200, 'Notification marked as read successfully.');
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return responseHelper.sendError(res, 500, 'Failed to mark notification as read.', error);
  }
};

const markAllRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await notificationModel.markAllAsRead(userId);
    return responseHelper.sendSuccess(res, 200, 'All notifications marked as read.');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return responseHelper.sendError(res, 500, 'Failed to mark all notifications as read.', error);
  }
};

const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id, 10);

    if (isNaN(notificationId)) {
      return responseHelper.sendError(res, 400, 'Invalid notification ID.');
    }

    const success = await notificationModel.deleteNotification(notificationId, userId);
    if (!success) {
      return responseHelper.sendError(res, 404, 'Notification not found or not owned by user.');
    }

    return responseHelper.sendSuccess(res, 200, 'Notification deleted successfully.');
  } catch (error) {
    console.error('Error deleting notification:', error);
    return responseHelper.sendError(res, 500, 'Failed to delete notification.', error);
  }
};

const clearAll = async (req, res) => {
  try {
    const userId = req.user.id;
    await notificationModel.clearAll(userId);
    return responseHelper.sendSuccess(res, 200, 'All notifications cleared.');
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return responseHelper.sendError(res, 500, 'Failed to clear notifications.', error);
  }
};

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  clearAll
};
