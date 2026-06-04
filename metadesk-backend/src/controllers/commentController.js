import Comment from '../models/Comment.js'
import Notification from '../models/Notification.js'
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

    const comment = await Comment.create({
      body, project: project || null, task: task || null,
      author: req.user._id,
      mentions: mentions || [],
      replyTo: replyTo || { id: null, body: '', authorName: '' },
    })

    await comment.populate('author', 'name avatarStyleStyle username')
    await comment.populate('mentions', 'name username')

    if (mentions?.length) {
      await Notification.insertMany(
        mentions.filter(uid => uid !== req.user._id.toString()).map(uid => ({
          recipient: uid, sender: req.user._id, type: 'comment_mention',
          message: `${req.user.name} mentioned you in a comment`,
          link: project ? `/projects/${project}` : `/tasks/${task}`,
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
