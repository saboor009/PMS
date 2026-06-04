import { can, hasRoleAtLeast } from '../utils/accessControl.js'

export const isManagerOrAbove = (req, res, next) => {
  if (hasRoleAtLeast(req.user, 'manager')) return next()
  return res.status(403).json({ success: false, message: 'Managers and above only' })
}

export const isOwner = (req, res, next) => {
  if (hasRoleAtLeast(req.user, 'ceo')) return next()
  return res.status(403).json({ success: false, message: 'CEO only' })
}

export const requirePermission = permission => (req, res, next) => {
  if (can(req.user, permission)) return next()
  return res.status(403).json({ success: false, message: 'Insufficient permissions' })
}
