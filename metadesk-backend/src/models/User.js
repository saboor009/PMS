import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  username: {
    type: String, required: [true, 'Username is required'], unique: true, lowercase: true,
    match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'],
  },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true },
  password: { type: String, required: [true, 'Password is required'], minlength: [8, 'Password must be at least 8 characters'] },
  role: { type: String, enum: ['ceo', 'admin', 'owner', 'manager', 'employee'], default: 'employee' },
  team: { type: String, trim: true, default: '' },
  designation: { type: String, trim: true, default: '' },
  avatar: { type: String, default: '' },
  avatarStyle: {
    face: { type: String, default: '#F8C7A5' },
    hair: { type: String, default: '#1F2937' },
    shirt: { type: String, default: '#2F85C8' },
    accessory: { type: String, enum: ['none', 'glasses', 'cap'], default: 'none' },
  },
  bio: { type: String, maxlength: 300, default: '' },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date },
  declinedAt: { type: Date },
  verificationOtpHash: { type: String, default: '' },
  verificationOtpExpiresAt: { type: Date },
  verificationOtpLastSentAt: { type: Date },
  lastSeen: { type: Date, default: Date.now },
  notificationPrefs: {
    taskAssigned:      { type: Boolean, default: true },
    deadlineReminder:  { type: Boolean, default: true },
    projectUpdate:     { type: Boolean, default: true },
    commentMention:    { type: Boolean, default: true },
    fileUploaded:      { type: Boolean, default: false },
  },
  permissions: {
    viewTeam:          { type: Boolean, default: false },
    approveUsers:      { type: Boolean, default: false },
    manageUsers:       { type: Boolean, default: false },
    deleteUsers:       { type: Boolean, default: false },
    managePermissions: { type: Boolean, default: false },
    createProjects:    { type: Boolean, default: false },
    manageProjects:    { type: Boolean, default: false },
    deleteProjects:    { type: Boolean, default: false },
    createTasks:       { type: Boolean, default: true },
    assignTasks:       { type: Boolean, default: false },
    deleteTasks:       { type: Boolean, default: false },
    viewEmployeeSummary:  { type: Boolean, default: false },
    manageDailyTodos:     { type: Boolean, default: false },
    manageDepartments:    { type: Boolean, default: false },
  },
}, { timestamps: true })

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password)
}

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.verificationOtpHash
  delete obj.avatar
  return obj
}

const User = mongoose.model('User', userSchema)
export default User
