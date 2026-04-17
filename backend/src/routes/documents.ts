import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  documentUpload,
} from '../controllers/document.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/',      listDocuments)
router.get('/:id',   getDocument)
router.post('/',     documentUpload, createDocument)
router.patch('/:id', documentUpload, updateDocument)
router.delete('/:id', deleteDocument)

export default router
