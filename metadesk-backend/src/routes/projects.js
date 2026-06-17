import { Router } from 'express'
import { getProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember, uploadProjectFile, deleteProjectFile, updateMemberPermission } from '../controllers/projectController.js'
import { protect } from '../middleware/auth.js'
import { requirePermission } from '../middleware/roleCheck.js'
import multer from 'multer'

const upload = multer({ dest: 'uploads/projects/', limits: { fileSize: 50 * 1024 * 1024 } })

const router = Router()

router.use(protect)

router.get('/', getProjects)
router.post('/', requirePermission('createProjects'), createProject)
router.get('/:id', getProject)
router.put('/:id', updateProject)
router.delete('/:id', requirePermission('deleteProjects'), deleteProject)
router.post('/:id/members', addMember)
router.delete('/:id/members/:userId', removeMember)
router.put('/:id/members/:userId/permission', updateMemberPermission)
router.post('/:id/files', upload.single('file'), uploadProjectFile)
router.delete('/:id/files/:fileId', deleteProjectFile)

export default router
