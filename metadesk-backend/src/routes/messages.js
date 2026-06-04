import { Router } from 'express'
import { getConversation, getContacts, sendMessage, editMessage, deleteMessage, markAsRead, deleteConversation } from '../controllers/messageController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.use(protect)

router.get('/contacts', getContacts)
router.get('/:userId', getConversation)
router.post('/:userId', sendMessage)
router.put('/:messageId', editMessage)
router.delete('/:messageId', deleteMessage)
router.post('/:userId/read', markAsRead)
router.delete('/:userId/conversation', deleteConversation)

export default router
