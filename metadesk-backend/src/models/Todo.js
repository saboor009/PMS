import mongoose from 'mongoose'

const todoSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Todo title is required'], trim: true },
  notes: { type: String, default: '' },
  date: { type: Date, required: [true, 'Date is required'] },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isPersonal: { type: Boolean, default: true },
  recurrence: { type: String, enum: ['once', 'daily'], default: 'once' },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  completedDates: [{
    date: { type: Date, required: true },
    completedAt: { type: Date, default: Date.now },
  }],
  notificationSent: { type: Boolean, default: false },
}, { timestamps: true })

todoSchema.index({ assignedTo: 1, date: 1 })

const Todo = mongoose.model('Todo', todoSchema)
export default Todo
