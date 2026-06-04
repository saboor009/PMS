import { Router } from 'express'
import { getComments, createComment, editComment, deleteComment } from '../controllers/commentController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.use(protect)

router.get('/', getComments)
router.post('/', createComment)
router.put('/:id', editComment)
router.delete('/:id', deleteComment)

export default router
