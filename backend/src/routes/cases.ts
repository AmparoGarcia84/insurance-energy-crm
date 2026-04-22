import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listCases,
  getCase,
  createCase,
  updateCase,
  deleteCase,
} from '../controllers/case.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/',     listCases)
router.get('/:id',  getCase)
router.post('/',    createCase)
router.put('/:id',  updateCase)
router.delete('/:id', deleteCase)

export default router
