/**
 * api/users.ts — User management API client (admin-only)
 *
 * All endpoints require the current user to have the OWNER role.
 * The backend enforces this via middleware on the /admin/users routes.
 */

import { AuthUser } from './auth'

const API_URL = import.meta.env.VITE_API_URL

export interface NewUserData {
  displayName: string
  email: string
  role: 'OWNER' | 'EMPLOYEE'
  password: string
}

export async function getUsers(): Promise<AuthUser[]> {
  const res = await fetch(`${API_URL}/admin/users`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export async function createUser(data: NewUserData): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/admin/users`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create user')
  const result = await res.json()
  return result.user
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  // TODO: investigate what the client want to do with associated data when deleting a user
  if (!res.ok) throw new Error('Failed to delete user')
}
