import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: [true, 'Message body is required'], maxlength: 3000 },
  replyTo: {
    id: { type: String, default: null },
    body: { type: String, default: '' },
    authorName: { type: String, default: '' },
  },
  isRead: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true })

messageSchema.index({ sender: 1, recipient: 1 })
messageSchema.index({ recipient: 1, isRead: 1 })

const Message = mongoose.model('Message', messageSchema)
export default Message
