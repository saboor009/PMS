import Project from '../models/Project.js'
import Task from '../models/Task.js'
import Notification from '../models/Notification.js'
import ActivityLog from '../models/ActivityLog.js'
import { hasRoleAtLeast } from '../utils/accessControl.js'

export const getProjects = async (req, res, next) => {
  try {
    const { search, status } = req.query
    const { user } = req

    let filter = { isDeleted: false }
    if (!hasRoleAtLeast(user, 'manager')) {
      filter.$or = [{ owner: user._id }, { members: user._id }]
    }
    if (status) filter.status = status
    if (search) {
      const searchFilter = { $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ]}
      filter = { ...filter, ...searchFilter }
    }

    const projects = await Project.find(filter)
      .populate('owner', 'name avatarStyleStyle username')
      .populate('members', 'name avatarStyleStyle username')
      .sort({ updatedAt: -1 })

    res.json({ success: true, projects })
  } catch (error) {
    next(error)
  }
}

export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, isDeleted: false })
      .populate('owner', 'name avatarStyleStyle username designation')
      .populate('members', 'name avatarStyleStyle username designation team')

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' })

    const isMember = project.members.some(m => m._id.toString() === req.user._id.toString())
    const isOwner = project.owner._id.toString() === req.user._id.toString()
    if (!isMember && !isOwner && !hasRoleAtLeast(req.user, 'manager')) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    res.json({ success: true, project })
  } catch (error) {
    next(error)
  }
}

export const createProject = async (req, res, next) => {
  try {
    const { title, description, status, priority, startDate, deadline, tags, coverColor, members } = req.body
    const memberIds = [...new Set([req.user._id.toString(), ...((members || []).filter(Boolean))])]
    const project = await Project.create({
      title, description, status, priority, startDate, deadline, tags, coverColor,
      owner: req.user._id,
      members: memberIds,
    })
    await project.populate('owner', 'name avatarStyleStyle username')
    await project.populate('members', 'name avatarStyleStyle username designation')

    await ActivityLog.create({ project: project._id, user: req.user._id, action: 'created the project', targetType: 'project', targetId: project._id, targetTitle: project.title })

    res.status(201).json({ success: true, project })
  } catch (error) {
    next(error)
  }
}

export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, isDeleted: false })
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' })

    const fields = ['title', 'description', 'status', 'priority', 'startDate', 'deadline', 'tags', 'progress', 'coverColor']
    fields.forEach(f => { if (req.body[f] !== undefined) project[f] = req.body[f] })
    if (req.body.owner !== undefined) {
      if (!hasRoleAtLeast(req.user, 'ceo')) {
        return res.status(403).json({ success: false, message: 'Only CEO can assign the project manager' })
      }
      const ownerId = req.body.owner?.toString()
      const isProjectMember = project.members.some(member => member.toString() === ownerId)
      if (!ownerId || !isProjectMember) {
        return res.status(400).json({ success: false, message: 'Project manager must be a project member' })
      }
      project.owner = ownerId
    }
    if (req.body.status === 'completed' && !project.completedAt) project.completedAt = new Date()

    await project.save()
    await project.populate('owner', 'name avatarStyleStyle username designation')
    await project.populate('members', 'name avatarStyleStyle username designation team')

    await ActivityLog.create({ project: project._id, user: req.user._id, action: 'updated the project', targetType: 'project', targetId: project._id, targetTitle: project.title })

    const toNotify = project.members.filter(m => m._id.toString() !== req.user._id.toString())
    if (toNotify.length) {
      await Notification.insertMany(toNotify.map(m => ({
        recipient: m._id, sender: req.user._id, type: 'project_update',
        message: `${project.title} has been updated`,
        link: `/projects/${project._id}`,
      })))
    }

    res.json({ success: true, project })
  } catch (error) {
    next(error)
  }
}

export const deleteProject = async (req, res, next) => {
  try {
    await Project.findByIdAndUpdate(req.params.id, { isDeleted: true })
    await Task.updateMany({ project: req.params.id }, { isDeleted: true })
    res.json({ success: true, message: 'Project deleted' })
  } catch (error) {
    next(error)
  }
}

export const addMember = async (req, res, next) => {
  try {
    const { userId } = req.body
    const project = await Project.findOne({ _id: req.params.id, isDeleted: false })
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' })

    if (project.members.includes(userId)) return res.status(400).json({ success: false, message: 'Already a member' })
    project.members.push(userId)
    await project.save()
    await project.populate('members', 'name avatarStyleStyle username designation')

    await ActivityLog.create({ project: project._id, user: req.user._id, action: 'added a member', targetType: 'member', targetId: userId, targetTitle: '' })

    res.json({ success: true, project })
  } catch (error) {
    next(error)
  }
}

export const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, isDeleted: false })
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' })
    project.members = project.members.filter(m => m.toString() !== req.params.userId)
    await project.save()
    res.json({ success: true, message: 'Member removed' })
  } catch (error) {
    next(error)
  }
}

export const uploadProjectFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
    const File = (await import('../models/File.js')).default
    const file = await File.create({
      project: req.params.id, uploadedBy: req.user._id,
      fileName: req.file.filename, originalName: req.file.originalname,
      fileUrl: `/uploads/projects/${req.file.filename}`,
      fileType: req.file.mimetype.split('/')[0],
      mimeType: req.file.mimetype, size: req.file.size,
    })
    res.json({ success: true, file })
  } catch (error) {
    next(error)
  }
}

export const deleteProjectFile = async (req, res, next) => {
  try {
    const File = (await import('../models/File.js')).default
    await File.findByIdAndUpdate(req.params.fileId, { isDeleted: true })
    res.json({ success: true, message: 'File deleted' })
  } catch (error) {
    next(error)
  }
}

export const updateMemberPermission = async (req, res, next) => {
  res.json({ success: true, message: 'Permissions updated' })
}
