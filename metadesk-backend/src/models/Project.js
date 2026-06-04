import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Project title is required'], trim: true },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['planning', 'active', 'on_hold', 'completed', 'archived'], default: 'planning' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  startDate: { type: Date },
  deadline: { type: Date },
  completedAt: { type: Date },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  tags: [String],
  coverColor: { type: String, default: '#3c78f0' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true })

projectSchema.index({ isDeleted: 1 })

const Project = mongoose.model('Project', projectSchema)
export default Project
