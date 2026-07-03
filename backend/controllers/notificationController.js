const Notification = require('../models/Notification');
const User = require('../models/User');

// Get notifications for current user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
      read: false
    })
      .sort({ createdAt: -1 })
      .populate('relatedCase', 'caseNumber title');

    res.status(200).json({
      success: true,
      data: { notifications }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    // Auto-delete after read (configurable)
    if (process.env.AUTO_DELETE_READ_NOTIFICATIONS === 'true') {
      await Notification.findByIdAndDelete(notificationId);
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete all read notifications for user
exports.clearReadNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user._id,
      read: true
    });

    res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} read notifications`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Judge: Delete notification they sent (for notifications they created)
exports.judgeDeleteSentNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Find notification where sender is the judge
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      'metadata.fromJudge': req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or not authorized'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });

    res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getNotifications: exports.getNotifications,
  markAsRead: exports.markAsRead,
  deleteNotification: exports.deleteNotification,
  clearReadNotifications: exports.clearReadNotifications,
  judgeDeleteSentNotification: exports.judgeDeleteSentNotification,
  getUnreadCount: exports.getUnreadCount
};