import { Router } from 'express'
import { getTodos, createTodo, updateTodo, deleteTodo, getAssignedTodos } from '../controllers/todoController.js'
import { protect } from '../middleware/auth.js'
import { requirePermission } from '../middleware/roleCheck.js'

const router = Router()

router.use(protect)

router.get('/', getTodos)
router.post('/', createTodo)
router.get('/assigned', requirePermission('manageDailyTodos'), getAssignedTodos)
router.put('/:id', updateTodo)
router.delete('/:id', deleteTodo)

export default router
