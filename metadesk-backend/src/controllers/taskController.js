import Task from '../models/Task.js'
import Project from '../models/Project.js'
import Notification from '../models/Notification.js'
import File from '../models/File.js'
import { can, hasRoleAtLeast } from '../utils/accessControl.js'

export const getTasks = async (req, res, next) => {
  try {
    const { status, priority, project, scope, search, assignee } = req.query
    const { user } = req

    let filter = { isDeleted: false }
    if (scope === 'standalone') filter.project = null
    else if (scope === 'project') filter.project = { $ne: null }
    else if (!hasRoleAtLeast(user, 'manager')) {
      filter.$or = [{ assignedTo: user._id }, { createdBy: user._id }]
    }

    if (status) filter.status = status
    if (priority) filter.priority = priority
    if (project) filter.project = project
    if (assignee) filter.assignedTo = assignee
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ]

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name avatarStyleStyle username')
      .populate('createdBy', 'name avatarStyleStyle username')
      .populate('project', 'title')
      .sort({ dueDate: 1, createdAt: -1 })

    res.json({ success: true, tasks })
  } catch (error) {
    next(error)
  }
}

export const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false })
      .populate('assignedTo', 'name avatarStyleStyle username designation')
      .populate('createdBy', 'name avatarStyleStyle username')
      .populate('project', 'title members')

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' })
    const files = await File.find({ task: task._id, isDeleted: false })
      .populate('uploadedBy', 'name avatarStyleStyle username')
      .sort({ createdAt: -1 })

    res.json({ success: true, task, files })
  } catch (error) {
    next(error)
  }
}

export const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, project, assignedTo, dueDate, estimatedHours, subtasks, labels } = req.body
    const assignees = assignedTo || []

    if (assignees.length && !can(req.user, 'assignTasks')) {
      return res.status(403).json({ success: false, message: 'You do not have permission to assign tasks' })
    }

    const task = await Task.create({
      title, description, priority, labels,
      project: project || null,
      createdBy: req.user._id,
      assignedTo: assignees,
      dueDate, estimatedHours,
      subtasks: (subtasks || []).map(s => ({ title: s.title || s, isCompleted: false })),
    })

    await task.populate('assignedTo', 'name avatarStyleStyle username')
    await task.populate('createdBy', 'name avatarStyleStyle username')

    if (assignees.length) {
      await Notification.insertMany(
        assignees.filter(id => id !== req.user._id.toString()).map(uid => ({
          recipient: uid, sender: req.user._id, type: 'task_assigned',
          message: `You have been assigned: ${title}`,
          link: `/tasks/${task._id}`,
        }))
      )
    }

    res.status(201).json({ success: true, task })
  } catch (error) {
    next(error)
  }
}

export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false })
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' })

    const { user } = req
    const isManager = hasRoleAtLeast(user, 'manager')
    const canComplete = can(user, 'assignTasks')
    const isAssignee = task.assignedTo.some(a => a.toString() === user._id.toString())
    if (!isManager && !isAssignee) return res.status(403).json({ success: false, message: 'Access denied' })

    const { status, title, description, priority, dueDate, estimatedHours, loggedHours, project, labels } = req.body

    if (status) {
      if (status === 'done' && !canComplete) return res.status(403).json({ success: false, message: 'Only managers can mark tasks as Done' })
      const oldStatus = task.status
      task.status = status
      if (status === 'done' && !task.completedAt) task.completedAt = new Date()

      if (oldStatus !== status) {
        const others = task.assignedTo.filter(a => a.toString() !== user._id.toString())
        if (others.length) {
          await Notification.insertMany(others.map(uid => ({
            recipient: uid, sender: user._id, type: 'task_status_changed',
            message: `"${task.title}" moved to ${status.replace('_', ' ')}`,
            link: `/tasks/${task._id}`,
          })))
        }
      }
    }

    if (can(user, 'assignTasks') || task.createdBy.toString() === user._id.toString()) {
      if (title) task.title = title
      if (description !== undefined) task.description = description
      if (priority) task.priority = priority
      if (dueDate !== undefined) task.dueDate = dueDate
      if (estimatedHours !== undefined) task.estimatedHours = estimatedHours
      if (loggedHours !== undefined) task.loggedHours = loggedHours
      if (project !== undefined) task.project = project || null
      if (labels !== undefined) task.labels = labels
    }

    await task.save()
    await task.populate('assignedTo', 'name avatarStyleStyle username')
    res.json({ success: true, task })
  } catch (error) {
    next(error)
  }
}

export const deleteTask = async (req, res, next) => {
  try {
    await Task.findByIdAndUpdate(req.params.id, { isDeleted: true })
    res.json({ success: true, message: 'Task deleted' })
  } catch (error) {
    next(error)
  }
}

export const addAssignee = async (req, res, next) => {
  try {
    const { userId } = req.body
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false })
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' })
    if (!task.assignedTo.includes(userId)) task.assignedTo.push(userId)
    await task.save()
    await task.populate('assignedTo', 'name avatarStyleStyle username')
    res.json({ success: true, task })
  } catch (error) {
    next(error)
  }
}

export const removeAssignee = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false })
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' })
    task.assignedTo = task.assignedTo.filter(a => a.toString() !== req.params.userId)
    await task.save()
    res.json({ success: true, message: 'Assignee removed' })
  } catch (error) {
    next(error)
  }
}

export const addSubtask = async (req, res, next) => {
  try {
    const { title } = req.body
    if (!title?.trim()) return res.status(400).json({ success: false, message: 'Subtask title is required' })

    const task = await Task.findOne({ _id: req.params.id, isDeleted: false })
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' })

    const isManager = hasRoleAtLeast(req.user, 'manager')
    const isAssignee = task.assignedTo.some(a => a.toString() === req.user._id.toString())
    const isCreator = task.createdBy.toString() === req.user._id.toString()
    if (!isManager && !isAssignee && !isCreator) return res.status(403).json({ success: false, message: 'Access denied' })

    task.subtasks.push({ title: title.trim(), isCompleted: false })
    await task.save()
    const subtask = task.subtasks[task.subtasks.length - 1]

    res.status(201).json({ success: true, subtask })
  } catch (error) {
    next(error)
  }
}

export const logHours = async (req, res, next) => {
  try {
    const { hours } = req.body
    await Task.findByIdAndUpdate(req.params.id, { $inc: { loggedHours: hours } })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export const uploadTaskFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
    const File = (await import('../models/File.js')).default
    const file = await File.create({
      task: req.params.id, uploadedBy: req.user._id,
      fileName: req.file.filename, originalName: req.file.originalname,
      fileUrl: `/uploads/tasks/${req.file.filename}`,
      fileType: req.file.mimetype.split('/')[0],
      mimeType: req.file.mimetype, size: req.file.size,
    })
    await file.populate('uploadedBy', 'name avatarStyleStyle username')
    res.json({ success: true, file })
  } catch (error) {
    next(error)
  }
}

export const deleteTaskFile = async (req, res, next) => {
  try {
    const File = (await import('../models/File.js')).default
    await File.findByIdAndUpdate(req.params.fileId, { isDeleted: true })
    res.json({ success: true, message: 'File deleted' })
  } catch (error) {
    next(error)
  }
}

export const updateSubtask = async (req, res, next) => {
  try {
    const { isCompleted } = req.body
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false })
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' })
    const subtask = task.subtasks.id(req.params.subtaskId)
    if (!subtask) return res.status(404).json({ success: false, message: 'Subtask not found' })
    subtask.isCompleted = isCompleted
    await task.save()
    res.json({ success: true, subtask })
  } catch (error) {
    next(error)
  }
}
