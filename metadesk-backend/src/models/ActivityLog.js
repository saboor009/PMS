import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String, enum: ['project', 'task', 'file', 'comment', 'member'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetTitle: { type: String, required: true },
  meta: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true })

activityLogSchema.index({ project: 1, createdAt: -1 })

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema)
export default ActivityLog
