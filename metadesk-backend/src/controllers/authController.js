import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Notification from '../models/Notification.js'
import { hasRoleAtLeast } from '../utils/accessControl.js'

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' })

export const register = async (req, res, next) => {
  try {
    const { name, username, email, password, team, designation } = req.body

    const existing = await User.findOne({ $or: [{ email }, { username }] })
    if (existing) {
      return res.status(400).json({ success: false, message: existing.email === email ? 'Email already registered' : 'Username already taken' })
    }

    const user = await User.create({ name, username, email, password, team, designation, approvalStatus: 'pending' })

    const managers = (await User.find({ role: { $in: ['manager', 'admin', 'ceo', 'owner'] }, isActive: true, approvalStatus: 'approved' }))
      .filter(user => hasRoleAtLeast(user, 'manager'))
    if (managers.length) {
      await Notification.insertMany(managers.map(m => ({
        recipient: m._id, type: 'account_request',
        message: `${name} has requested access to Metadesk Global`,
        link: '/team?tab=requests',
      })))
    }

    res.status(201).json({ success: true, message: 'Registration submitted. Awaiting manager approval.' })
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' })
    if (user.approvalStatus === 'pending') return res.status(403).json({ success: false, message: 'Your account is pending approval' })
    if (user.approvalStatus === 'declined') return res.status(403).json({ success: false, message: 'Your account request was declined' })
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Your account has been deactivated' })

    const isMatch = await user.matchPassword(password)
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    // Update lastSeen without triggering full document validation
    await User.findByIdAndUpdate(user._id, { lastSeen: new Date() })

    res.json({ success: true, token: generateToken(user._id), user: user.toPublicJSON() })
  } catch (error) {
    next(error)
  }
}

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -verificationOtpHash')
    res.json({ success: true, user })
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const { name, username, email, team, designation, bio, notificationPrefs, avatarStyle } = req.body
    const user = await User.findById(req.user._id)

    if (username && username !== user.username) {
      const taken = await User.findOne({ username, _id: { $ne: user._id } })
      if (taken) return res.status(400).json({ success: false, message: 'Username already taken' })
    }

    if (name) user.name = name
    if (username) user.username = username
    if (email) user.email = email
    if (team !== undefined) user.team = team
    if (designation !== undefined) user.designation = designation
    if (bio !== undefined) user.bio = bio
    if (notificationPrefs !== undefined) user.notificationPrefs = { ...user.notificationPrefs.toObject(), ...notificationPrefs }
    if (avatarStyle !== undefined) {
      const currentAvatarStyle = user.avatarStyle?.toObject?.() || user.avatarStyle || {}
      user.avatarStyle = { ...currentAvatarStyle, ...avatarStyle }
      user.avatar = ''
    }

    await user.save()
    res.json({ success: true, user: user.toPublicJSON() })
  } catch (error) {
    next(error)
  }
}

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)

    const isMatch = await user.matchPassword(currentPassword)
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' })
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' })

    user.password = newPassword
    await user.save()
    res.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    next(error)
  }
}
