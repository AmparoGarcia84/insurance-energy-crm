import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import * as adminService from '../services/admin.service'

function requireOwner(req: AuthRequest, res: Response): boolean {
  if (req.user?.role !== 'OWNER') {
    res.status(403).json({ error: 'Forbidden' })
    return false
  }
  return true
}

export async function listUsers(req: AuthRequest, res: Response) {
  if (!requireOwner(req, res)) return
  const users = await adminService.listUsers()
  res.json(users)
}

export async function createUser(req: AuthRequest, res: Response) {
  if (!requireOwner(req, res)) return
  const { displayName, email, role, password } = req.body
  if (!displayName || !email || !role || !password) {
    res.status(400).json({ error: 'displayName, email, role and password are required' })
    return
  }
  try {
    const user = await adminService.createUser({ displayName, email, role, password })
    res.status(201).json({ user })
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Email already in use' })
      return
    }
    res.status(500).json({ error: 'Failed to create user' })
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  if (!requireOwner(req, res)) return
  const { id } = req.params
  if (id === req.user!.userId) {
    res.status(400).json({ error: 'Cannot delete your own account' })
    return
  }
  try {
    await adminService.deleteUser(id)
    res.status(204).end()
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.status(500).json({ error: 'Failed to delete user' })
  }
}
