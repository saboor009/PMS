import mongoose from 'mongoose'

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
}, { timestamps: true })

departmentSchema.pre('save', function (next) {
  if (this.isModified('name')) this.slug = this.name.toLowerCase().replace(/\s+/g, '-')
  next()
})

const Department = mongoose.model('Department', departmentSchema)
export default Department
