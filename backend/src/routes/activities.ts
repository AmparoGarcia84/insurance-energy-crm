import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../controllers/activity.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/',      listActivities)
router.get('/:id',   getActivity)
router.post('/',     createActivity)
router.patch('/:id', updateActivity)
router.delete('/:id', deleteActivity)

export default router
