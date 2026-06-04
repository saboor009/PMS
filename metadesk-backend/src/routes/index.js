import { Router } from 'express'
import authRoutes from './auth.js'
import dashboardRoutes from './dashboard.js'
import userRoutes from './users.js'
import projectRoutes from './projects.js'
import taskRoutes from './tasks.js'
import messageRoutes from './messages.js'
import notificationRoutes from './notifications.js'
import todoRoutes from './todos.js'
import commentRoutes from './comments.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/users', userRoutes)
router.use('/projects', projectRoutes)
router.use('/tasks', taskRoutes)
router.use('/messages', messageRoutes)
router.use('/notifications', notificationRoutes)
router.use('/todos', todoRoutes)
router.use('/comments', commentRoutes)

export default router
