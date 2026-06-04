import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { hasRoleAtLeast } from '../utils/accessControl.js'

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' })
    }
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password -verificationOtpHash')
    if (!user) return res.status(401).json({ success: false, message: 'User not found' })
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account is deactivated' })
    if (user.approvalStatus !== 'approved') return res.status(403).json({ success: false, message: 'Account not approved' })
    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.some(role => req.user.role === role || hasRoleAtLeast(req.user, role))) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' })
  }
  next()
}
