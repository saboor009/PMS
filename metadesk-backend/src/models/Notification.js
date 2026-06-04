import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  type: {
    type: String,
    enum: [
      'task_assigned', 'task_deadline', 'project_update', 'comment_added',
      'comment_reply', 'comment_mention', 'file_uploaded', 'project_assigned',
      'task_completed', 'task_status_changed', 'direct_message', 'account_request',
    ],
    required: true,
  },
  message: { type: String, required: true },
  link: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true })

notificationSchema.index({ recipient: 1, isRead: 1 })
notificationSchema.index({ createdAt: -1 })

const Notification = mongoose.model('Notification', notificationSchema)
export default Notification
