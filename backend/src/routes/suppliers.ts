import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplier.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/',    listSuppliers)
router.get('/:id', getSupplier)
router.post('/',   createSupplier)
router.put('/:id', updateSupplier)
router.delete('/:id', deleteSupplier)

export default router
