import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, default: '', maxlength: 5000 },
  attachments: [{
    fileName: { type: String, required: true },
    originalName: { type: String, default: '' },
    fileUrl: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  }],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replyTo: {
    id: { type: String, default: null },
    body: { type: String, default: '' },
    authorName: { type: String, default: '' },
  },
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true })

commentSchema.index({ project: 1 })
commentSchema.index({ task: 1 })

const Comment = mongoose.model('Comment', commentSchema)
export default Comment
