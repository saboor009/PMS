import { Router } from 'express'
import { getTasks, getTask, createTask, updateTask, deleteTask, addAssignee, removeAssignee, addTaskManager, removeTaskManager, reviewTask, logHours, uploadTaskFile, downloadTaskFile, deleteTaskFile, addSubtask, updateSubtask } from '../controllers/taskController.js'
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
router.delete('/:id', deleteTask)
router.post('/:id/assignees', addAssignee)
router.delete('/:id/assignees/:userId', removeAssignee)
router.post('/:id/hours', logHours)
router.post('/:id/files', upload.single('file'), uploadTaskFile)
router.get('/:id/files/:fileId/download', downloadTaskFile)
router.delete('/:id/files/:fileId', deleteTaskFile)
router.post('/:id/task-managers', addTaskManager)
router.delete('/:id/task-managers/:userId', removeTaskManager)
router.post('/:id/review', reviewTask)
router.post('/:id/subtasks', addSubtask)
router.put('/:id/subtasks/:subtaskId', updateSubtask)

export default router
