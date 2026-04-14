import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listCollaborators,
  getCollaborator,
  createCollaborator,
  updateCollaborator,
  deleteCollaborator,
} from '../controllers/collaborator.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/', listCollaborators)
router.get('/:id', getCollaborator)
router.post('/', createCollaborator)
router.put('/:id', updateCollaborator)
router.delete('/:id', deleteCollaborator)

export default router
