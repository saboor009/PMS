import { Router } from 'express'
import { getComments, createComment, editComment, downloadCommentAttachment, deleteComment } from '../controllers/commentController.js'
import { protect } from '../middleware/auth.js'
import multer from 'multer'

const upload = multer({ dest: 'uploads/comments/', limits: { fileSize: 50 * 1024 * 1024 } })

const router = Router()

router.use(protect)

router.get('/', getComments)
router.post('/', upload.single('file'), createComment)
router.get('/:id/attachments/:attachmentId/download', downloadCommentAttachment)
router.put('/:id', editComment)
router.delete('/:id', deleteComment)

export default router
