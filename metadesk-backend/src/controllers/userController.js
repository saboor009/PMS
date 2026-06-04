import User from '../models/User.js'
import Task from '../models/Task.js'
import Project from '../models/Project.js'
import { DEFAULT_PERMISSIONS, hasRoleAtLeast, roleLevel } from '../utils/accessControl.js'

export const getUsers = async (req, res, next) => {
  try {
    const { search, team, role, includeStats } = req.query
    const filter = { approvalStatus: 'approved' }

    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { designation: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } },
    ]
    if (team) filter.team = team
    if (role) filter.role = role

    const users = await User.find(filter).select('-password -verificationOtpHash -avatar').sort({ name: 1 })
    if (includeStats !== 'true') return res.json({ success: true, users })

    const userIds = users.map(user => user._id)
    const now = new Date()
    const dueSoon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

    const [taskStats, projectStats] = await Promise.all([
      Task.aggregate([
        { $match: { assignedTo: { $in: userIds }, status: { $ne: 'done' }, isDeleted: false } },
        { $unwind: '$assignedTo' },
        { $match: { assignedTo: { $in: userIds } } },
        {
          $group: {
            _id: '$assignedTo',
            openTasks: { $sum: 1 },
            tasksDueSoon: {
              $sum: {
                $cond: [
                  { $and: [{ $gte: ['$dueDate', now] }, { $lte: ['$dueDate', dueSoon] }] },
                  1,
                  0,
                ],
              },
            },
            overdueTasks: {
              $sum: {
                $cond: [{ $lt: ['$dueDate', now] }, 1, 0],
              },
            },
          },
        },
      ]),
      Project.aggregate([
        { $match: { members: { $in: userIds }, status: 'active', isDeleted: false } },
        { $unwind: '$members' },
        { $match: { members: { $in: userIds } } },
        { $group: { _id: '$members', activeProjects: { $sum: 1 } } },
      ]),
    ])

    const statsByUser = new Map()
    taskStats.forEach(stat => {
      statsByUser.set(String(stat._id), {
        openTasks: stat.openTasks || 0,
        tasksDueSoon: stat.tasksDueSoon || 0,
        overdueTasks: stat.overdueTasks || 0,
      })
    })
    projectStats.forEach(stat => {
      const key = String(stat._id)
      statsByUser.set(key, {
        openTasks: 0,
        tasksDueSoon: 0,
        overdueTasks: 0,
        ...statsByUser.get(key),
        activeProjects: stat.activeProjects || 0,
      })
    })

    res.json({
      success: true,
      users: users.map(user => ({
        ...user.toObject(),
        openTasks: 0,
        activeProjects: 0,
        tasksDueSoon: 0,
        overdueTasks: 0,
        ...statsByUser.get(String(user._id)),
      })),
    })
  } catch (error) {
    next(error)
  }
}

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -verificationOtpHash -avatar')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const openTasks = await Task.countDocuments({ assignedTo: user._id, status: { $ne: 'done' }, isDeleted: false })
    const activeProjects = await Project.countDocuments({ members: user._id, status: 'active', isDeleted: false })
    const tasksDueSoon = await Task.countDocuments({
      assignedTo: user._id, status: { $ne: 'done' }, isDeleted: false,
      dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    })
    const overdueTasks = await Task.countDocuments({
      assignedTo: user._id, status: { $ne: 'done' }, isDeleted: false, dueDate: { $lt: new Date() },
    })

    res.json({ success: true, user, stats: { openTasks, activeProjects, tasksDueSoon, overdueTasks } })
  } catch (error) {
    next(error)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const { team, role, isActive } = req.body
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    if (roleLevel(user.role) >= roleLevel(req.user.role) && req.user._id.toString() !== user._id.toString() && !hasRoleAtLeast(req.user, 'ceo')) {
      return res.status(403).json({ success: false, message: 'Cannot modify users at or above your access level' })
    }

    if (role !== undefined && roleLevel(role) >= roleLevel('admin') && !hasRoleAtLeast(req.user, 'ceo')) {
      return res.status(403).json({ success: false, message: 'Only CEO can assign Admin or CEO access' })
    }

    if (team !== undefined) user.team = team
    if (role !== undefined) {
      user.role = role
      user.permissions = DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.employee
    }
    if (isActive !== undefined) user.isActive = isActive

    await user.save()
    res.json({ success: true, user: user.toPublicJSON() })
  } catch (error) {
    next(error)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    if (roleLevel(user.role) >= roleLevel(req.user.role)) return res.status(403).json({ success: false, message: 'Cannot delete users at or above your access level' })

    await Task.updateMany({ assignedTo: user._id }, { $pull: { assignedTo: user._id } })
    await Project.updateMany({ members: user._id }, { $pull: { members: user._id } })
    await User.findByIdAndDelete(user._id)

    res.json({ success: true, message: 'User deleted' })
  } catch (error) {
    next(error)
  }
}

export const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    if (roleLevel(user.role) >= roleLevel(req.user.role)) return res.status(403).json({ success: false, message: 'Cannot deactivate users at or above your access level' })
    user.isActive = !user.isActive
    await user.save()
    res.json({ success: true, isActive: user.isActive })
  } catch (error) {
    next(error)
  }
}

export const updatePermissions = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    if (!hasRoleAtLeast(req.user, 'ceo') && roleLevel(user.role) >= roleLevel(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Cannot change permissions for this role' })
    }
    user.permissions = { ...(user.permissions?.toObject?.() || {}), ...req.body }
    await user.save()
    res.json({ success: true, permissions: user.permissions })
  } catch (error) {
    next(error)
  }
}

export const getPendingRequests = async (req, res, next) => {
  try {
    const users = await User.find({ approvalStatus: 'pending' }).select('-password -verificationOtpHash -avatar').sort({ createdAt: -1 })
    res.json({ success: true, users })
  } catch (error) {
    next(error)
  }
}

export const approveUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: 'approved', isActive: true, approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    ).select('-password -verificationOtpHash -avatar')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, user })
  } catch (error) {
    next(error)
  }
}

export const declineUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { approvalStatus: 'declined', declinedAt: new Date() })
    res.json({ success: true, message: 'Request declined' })
  } catch (error) {
    next(error)
  }
}

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
    const avatarUrl = `/uploads/avatars/${req.file.filename}`
    await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl })
    res.json({ success: true, avatarUrl })
  } catch (error) {
    next(error)
  }
}
