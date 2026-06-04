import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: [true, 'Comment body is required'], maxlength: 5000 },
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
