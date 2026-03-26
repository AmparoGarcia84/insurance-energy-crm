import { Router, text } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  importClients,
} from '../controllers/client.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/',           listClients)
router.get('/:id',        getClient)
router.post('/',          createClient)
router.put('/:id',        updateClient)
router.delete('/:id',     deleteClient)
// text() parses the raw CSV body (up to 10 MB) — must come before the handler
router.post('/import', text({ limit: '10mb', defaultCharset: 'utf-8' }), importClients)

export default router
