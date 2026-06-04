import mongoose from 'mongoose'

const fileSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  originalName: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  publicId: { type: String, default: '' },
  fileType: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  dataUrl: { type: String },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true })

const File = mongoose.model('File', fileSchema)
export default File
