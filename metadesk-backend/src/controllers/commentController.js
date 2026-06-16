import Comment from '../models/Comment.js'
import Notification from '../models/Notification.js'
import Project from '../models/Project.js'
import Task from '../models/Task.js'
import { hasRoleAtLeast } from '../utils/accessControl.js'

export const getComments = async (req, res, next) => {
  try {
    const { project, task } = req.query
    const filter = { isDeleted: false }
    if (project) filter.project = project
    if (task) filter.task = task

    const comments = await Comment.find(filter)
      .populate('author', 'name avatarStyleStyle username')
      .populate('mentions', 'name username')
      .sort({ createdAt: 1 })

    res.json({ success: true, comments })
  } catch (error) {
    next(error)
  }
}

export const createComment = async (req, res, next) => {
  try {
    const { body, project, task, replyTo, mentions } = req.body
    const mentionIds = [...new Set((mentions || []).filter(Boolean).map(uid => uid.toString()))]

    let mentionProject = null
    if (task) {
      const relatedTask = await Task.findOne({ _id: task, isDeleted: false }).select('project')
      if (!relatedTask) return res.status(404).json({ success: false, message: 'Task not found' })
      if (relatedTask.project) {
        mentionProject = await Project.findOne({ _id: relatedTask.project, isDeleted: false }).select('members')
      }
    } else if (project) {
      mentionProject = await Project.findOne({ _id: project, isDeleted: false }).select('members')
      if (!mentionProject) return res.status(404).json({ success: false, message: 'Project not found' })
    }

    const projectMemberIds = mentionProject?.members?.map(member => member.toString()) || []
    const allowedMentionIds = mentionProject
      ? mentionIds.filter(uid => projectMemberIds.includes(uid))
      : []

    const comment = await Comment.create({
      body, project: project || null, task: task || null,
      author: req.user._id,
      mentions: allowedMentionIds,
      replyTo: replyTo || { id: null, body: '', authorName: '' },
    })

    await comment.populate('author', 'name avatarStyleStyle username')
    await comment.populate('mentions', 'name username')

    if (allowedMentionIds.length) {
      await Notification.insertMany(
        allowedMentionIds.filter(uid => uid !== req.user._id.toString()).map(uid => ({
          recipient: uid, sender: req.user._id, type: 'comment_mention',
          message: `${req.user.name} mentioned you in a comment`,
          link: task ? `/tasks/${task}` : `/projects/${project}`,
        }))
      )
    }

    res.status(201).json({ success: true, comment })
  } catch (error) {
    next(error)
  }
}

export const editComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' })
    if (comment.author.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Cannot edit others comments' })
    comment.body = req.body.body
    comment.isEdited = true
    await comment.save()
    res.json({ success: true, comment })
  } catch (error) {
    next(error)
  }
}

export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' })
    const isManager = hasRoleAtLeast(req.user, 'manager')
    const isAuthor = comment.author.toString() === req.user._id.toString()
    if (!isAuthor && !isManager) return res.status(403).json({ success: false, message: 'Access denied' })
    comment.isDeleted = true
    await comment.save()
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}
