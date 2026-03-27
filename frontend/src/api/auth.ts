/**
 * api/auth.ts — Authentication API client
 *
 * Thin wrapper around the backend /auth endpoints. All requests use
 * credentials: 'include' so the browser sends and receives the httpOnly
 * cookie that holds the JWT — the token itself never touches JavaScript.
 */

const API_URL = import.meta.env.VITE_API_URL

/** Shape of the user object returned by the backend. */
export interface AuthUser {
  id: string
  email: string
  role: 'OWNER' | 'EMPLOYEE'
  displayName: string
  avatarUrl?: string | null
}

/**
 * Sends credentials to the backend. On success the server sets an httpOnly
 * cookie and returns only the user profile (no token in the response body).
 * Throws on failure — the caller displays the error.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send/receive cookies cross-origin
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) throw new Error('Invalid credentials')

  const data = await res.json()
  return data.user
}

/**
 * Fetches the current user's profile using the existing cookie.
 * Called on app load to rehydrate the session after a page refresh.
 * Returns null if there is no valid session (401).
 */
export async function getMe(): Promise<AuthUser | null> {
  const res = await fetch(`${API_URL}/auth/me`, {
    credentials: 'include',
  })

  if (!res.ok) return null
  return res.json()
}

/**
 * Tells the backend to clear the auth cookie.
 * The frontend also clears its in-memory state after calling this.
 */
export async function logout(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}

/**
 * Uploads a profile photo. Sends the file as multipart/form-data and returns
 * the updated user profile (with the new avatarUrl).
 */
export async function uploadAvatar(image: Blob | File): Promise<AuthUser> {
  const body = new FormData()
  const filename = image instanceof File ? image.name : 'avatar.jpg'
  body.append('avatar', image, filename)

  const res = await fetch(`${API_URL}/auth/avatar`, {
    method: 'POST',
    credentials: 'include',
    body,
  })

  if (!res.ok) throw new Error('Failed to upload avatar')

  const data = await res.json()
  return data.user
}
