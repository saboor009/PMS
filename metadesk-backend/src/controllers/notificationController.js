import Notification from '../models/Notification.js'

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name avatarStyle username')
      .sort({ createdAt: -1 })
      .limit(50)
    res.json({ success: true, notifications })
  } catch (error) {
    next(error)
  }
}

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false })
    res.json({ success: true, count })
  } catch (error) {
    next(error)
  }
}

export const markRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { isRead: true, readAt: new Date() })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}
