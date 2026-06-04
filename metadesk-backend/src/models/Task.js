import mongoose from 'mongoose'

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
})

const taskSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Task title is required'], trim: true },
  description: { type: String, default: '' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['todo', 'in_progress', 'review', 'done'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  dueDate: { type: Date },
  completedAt: { type: Date },
  subtasks: [subtaskSchema],
  labels: [String],
  estimatedHours: { type: Number },
  loggedHours: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true })

taskSchema.index({ isDeleted: 1 })
taskSchema.index({ project: 1 })
taskSchema.index({ assignedTo: 1 })

const Task = mongoose.model('Task', taskSchema)
export default Task
