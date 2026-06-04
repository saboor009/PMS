import Message from '../models/Message.js'
import User from '../models/User.js'
import Notification from '../models/Notification.js'

export const getContacts = async (req, res, next) => {
  try {
    const userId = req.user._id
    const users = await User.find({ _id: { $ne: userId }, isActive: true, approvalStatus: 'approved' })
      .select('-password -verificationOtpHash').sort({ name: 1 })

    const userIds = users.map(user => user._id)
    const lastMessages = await Message.aggregate([
      {
        $match: {
          deletedFor: { $ne: userId },
          isDeleted: false,
          $or: [
            { sender: userId, recipient: { $in: userIds } },
            { sender: { $in: userIds }, recipient: userId },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          contactId: {
            $cond: [{ $eq: ['$sender', userId] }, '$recipient', '$sender'],
          },
        },
      },
      { $group: { _id: '$contactId', lastMessage: { $first: '$$ROOT' } } },
    ])

    const unreadCounts = await Message.aggregate([
      {
        $match: {
          sender: { $in: userIds },
          recipient: userId,
          isRead: false,
          deletedFor: { $ne: userId },
          isDeleted: false,
        },
      },
      { $group: { _id: '$sender', count: { $sum: 1 } } },
    ])

    const lastByUser = new Map(lastMessages.map(item => [item._id.toString(), item.lastMessage]))
    const unreadByUser = new Map(unreadCounts.map(item => [item._id.toString(), item.count]))
    const contacts = users.map(user => ({
      ...user.toObject(),
      lastMessage: lastByUser.get(user._id.toString()) || null,
      unreadCount: unreadByUser.get(user._id.toString()) || 0,
    }))

    contacts.sort((a, b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0))
    res.json({ success: true, contacts })
  } catch (error) {
    next(error)
  }
}

export const getConversation = async (req, res, next) => {
  try {
    const userId = req.user._id
    const otherId = req.params.userId
    const messages = await Message.find({
      $or: [{ sender: userId, recipient: otherId }, { sender: otherId, recipient: userId }],
      deletedFor: { $ne: userId }, isDeleted: false,
    }).populate('sender', 'name avatar avatarStyle username').sort({ createdAt: 1 })
    res.json({ success: true, messages })
  } catch (error) {
    next(error)
  }
}

export const sendMessage = async (req, res, next) => {
  try {
    const { body, replyTo } = req.body
    const message = await Message.create({
      sender: req.user._id, recipient: req.params.userId, body,
      replyTo: replyTo || { id: null, body: '', authorName: '' },
    })
    await message.populate('sender', 'name avatar avatarStyle username')
    await Notification.create({
      recipient: req.params.userId,
      sender: req.user._id,
      type: 'direct_message',
      message: `${req.user.name} sent you a message`,
      link: `/messages?user=${req.user._id}`,
    })
    res.status(201).json({ success: true, message })
  } catch (error) {
    next(error)
  }
}

export const editMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId)
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' })
    if (message.sender.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Cannot edit others messages' })
    message.body = req.body.body
    message.isEdited = true
    await message.save()
    res.json({ success: true, message })
  } catch (error) {
    next(error)
  }
}

export const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId)
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' })
    if (message.sender.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Cannot delete others messages' })
    message.isDeleted = true
    await message.save()
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export const markAsRead = async (req, res, next) => {
  try {
    await Message.updateMany({ sender: req.params.userId, recipient: req.user._id, isRead: false }, { isRead: true })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export const deleteConversation = async (req, res, next) => {
  try {
    await Message.updateMany({
      $or: [{ sender: req.user._id, recipient: req.params.userId }, { sender: req.params.userId, recipient: req.user._id }],
    }, { $addToSet: { deletedFor: req.user._id } })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}
