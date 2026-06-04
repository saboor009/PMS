import { Router } from 'express'
import { getNotifications, markRead, markAllRead, getUnreadCount } from '../controllers/notificationController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.use(protect)

router.get('/', getNotifications)
router.get('/unread-count', getUnreadCount)
router.put('/:id/read', markRead)
router.put('/mark-all-read', markAllRead)

export default router
