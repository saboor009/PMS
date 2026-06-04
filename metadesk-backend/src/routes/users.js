import { Router } from 'express'
import { getUsers, getUser, updateUser, deleteUser, deactivateUser, updatePermissions, getPendingRequests, approveUser, declineUser, uploadAvatar } from '../controllers/userController.js'
import { protect } from '../middleware/auth.js'
import { requirePermission } from '../middleware/roleCheck.js'
import multer from 'multer'

const upload = multer({ dest: 'uploads/avatars/', limits: { fileSize: 5 * 1024 * 1024 } })

const router = Router()

router.use(protect)

router.get('/', getUsers)
router.get('/pending', requirePermission('approveUsers'), getPendingRequests)
router.post('/pending/:id/approve', requirePermission('approveUsers'), approveUser)
router.post('/pending/:id/decline', requirePermission('approveUsers'), declineUser)
router.get('/:id', getUser)
router.put('/:id', requirePermission('manageUsers'), updateUser)
router.delete('/:id', requirePermission('deleteUsers'), deleteUser)
router.put('/:id/deactivate', requirePermission('manageUsers'), deactivateUser)
router.put('/:id/permissions', requirePermission('managePermissions'), updatePermissions)
router.post('/avatar', upload.single('avatar'), uploadAvatar)

export default router
