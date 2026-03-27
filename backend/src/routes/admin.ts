import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { listUsers, createUser, deleteUser } from '../controllers/admin.controller'

const router = Router()

router.get('/users', requireAuth, listUsers)
router.post('/users', requireAuth, createUser)
router.delete('/users/:id', requireAuth, deleteUser)

export default router
