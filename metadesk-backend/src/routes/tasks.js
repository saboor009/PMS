import { Router } from 'express'
import { getTasks, getTask, createTask, updateTask, deleteTask, addAssignee, removeAssignee, logHours, uploadTaskFile, deleteTaskFile, addSubtask, updateSubtask } from '../controllers/taskController.js'
import { protect } from '../middleware/auth.js'
import { requirePermission } from '../middleware/roleCheck.js'
import multer from 'multer'

const upload = multer({ dest: 'uploads/tasks/', limits: { fileSize: 50 * 1024 * 1024 } })

const router = Router()

router.use(protect)

router.get('/', getTasks)
router.post('/', requirePermission('createTasks'), createTask)
router.get('/:id', getTask)
router.put('/:id', updateTask)
router.delete('/:id', requirePermission('deleteTasks'), deleteTask)
router.post('/:id/assignees', requirePermission('assignTasks'), addAssignee)
router.delete('/:id/assignees/:userId', requirePermission('assignTasks'), removeAssignee)
router.post('/:id/hours', logHours)
router.post('/:id/files', upload.single('file'), uploadTaskFile)
router.delete('/:id/files/:fileId', deleteTaskFile)
router.post('/:id/subtasks', addSubtask)
router.put('/:id/subtasks/:subtaskId', updateSubtask)

export default router
