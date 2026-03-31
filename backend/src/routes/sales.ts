import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
} from '../controllers/sale.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/', listSales)
router.get('/:id', getSale)
router.post('/', createSale)
router.put('/:id', updateSale)
router.delete('/:id', deleteSale)

export default router
