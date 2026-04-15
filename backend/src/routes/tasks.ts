import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/',     listTasks)
router.get('/:id',  getTask)
router.post('/',    createTask)
router.patch('/:id', updateTask)
router.delete('/:id', deleteTask)

export default router
