import Todo from '../models/Todo.js'
import { can, hasRoleAtLeast } from '../utils/accessControl.js'

const getDayRange = date => {
  const targetDate = date ? new Date(date) : new Date()
  const start = new Date(targetDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(targetDate)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

const formatTodoForDate = (todo, start, end) => {
  const item = todo.toObject()
  if (item.recurrence !== 'daily') return item

  const completion = item.completedDates?.find(entry => {
    const completedDate = new Date(entry.date)
    return completedDate >= start && completedDate <= end
  })

  return {
    ...item,
    isCompleted: Boolean(completion),
    completedAt: completion?.completedAt || null,
  }
}

const getTodosForDate = (filter, start, end) => Todo.find({
  ...filter,
  $or: [
    { recurrence: { $ne: 'daily' }, date: { $gte: start, $lte: end } },
    { recurrence: 'daily', date: { $lte: end } },
  ],
})

export const getTodos = async (req, res, next) => {
  try {
    const { date } = req.query
    const { start, end } = getDayRange(date)

    const todos = await getTodosForDate({ assignedTo: req.user._id }, start, end)
      .populate('assignedBy', 'name avatarStyle username')
      .sort({ createdAt: 1 })

    res.json({ success: true, todos: todos.map(todo => formatTodoForDate(todo, start, end)) })
  } catch (error) {
    next(error)
  }
}

export const createTodo = async (req, res, next) => {
  try {
    const { title, notes, date, assignTo, recurrence } = req.body
    const { user } = req
    const isManager = can(user, 'manageDailyTodos')

    if (assignTo && assignTo !== user._id.toString() && !isManager) {
      return res.status(403).json({ success: false, message: 'Only managers can assign todos to others' })
    }

    const todo = await Todo.create({
      title,
      notes,
      date: date || new Date(),
      assignedTo: assignTo || user._id,
      assignedBy: assignTo && assignTo !== user._id.toString() ? user._id : null,
      isPersonal: !assignTo || assignTo === user._id.toString(),
      recurrence: recurrence === 'daily' ? 'daily' : 'once',
    })

    res.status(201).json({ success: true, todo })
  } catch (error) {
    next(error)
  }
}

export const updateTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.id)
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' })
    if (todo.assignedTo.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Access denied' })

    const { isCompleted, title, notes, date } = req.body
    if (isCompleted !== undefined && todo.recurrence === 'daily') {
      const { start, end } = getDayRange(date)
      todo.completedDates = (todo.completedDates || []).filter(entry => {
        const completedDate = new Date(entry.date)
        return completedDate < start || completedDate > end
      })
      if (isCompleted) todo.completedDates.push({ date: start, completedAt: new Date() })
    } else if (isCompleted !== undefined) {
      todo.isCompleted = isCompleted
      todo.completedAt = isCompleted ? new Date() : null
    }
    if (title) todo.title = title
    if (notes !== undefined) todo.notes = notes

    await todo.save()
    res.json({ success: true, todo })
  } catch (error) {
    next(error)
  }
}

export const deleteTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.id)
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' })
    const canDelete = todo.assignedTo.toString() === req.user._id.toString() || todo.assignedBy?.toString() === req.user._id.toString() || hasRoleAtLeast(req.user, 'admin')
    if (!canDelete) return res.status(403).json({ success: false, message: 'Access denied' })
    await Todo.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Todo deleted' })
  } catch (error) {
    next(error)
  }
}

export const getAssignedTodos = async (req, res, next) => {
  try {
    const { date } = req.query
    const { start, end } = getDayRange(date)

    const todos = await getTodosForDate({ assignedBy: req.user._id }, start, end)
      .populate('assignedTo', 'name avatarStyle username designation team')
      .sort({ createdAt: -1 })

    res.json({ success: true, todos: todos.map(todo => formatTodoForDate(todo, start, end)) })
  } catch (error) {
    next(error)
  }
}
