/**
 * Unit tests for auth.service.ts
 *
 * Both Prisma and bcrypt are mocked so no real database or
 * password hashing occurs. The focus is on:
 * - login: credential validation, timing-safe error messages, JWT issuance
 * - changePassword: current-password verification before updating
 * - changeEmail / getMe: delegate to Prisma correctly
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../db/prisma.js', () => ({
  default: {
    user: {
      findUnique:        vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update:            vi.fn(),
    },
  },
}))

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash:    vi.fn(),
  },
}))

import prisma from '../db/prisma.js'
import bcrypt from 'bcrypt'
import { login, getMe, changePassword, changeEmail, updateAvatar } from './auth.service.js'

const mockFindUnique        = vi.mocked(prisma.user.findUnique)
const mockFindUniqueOrThrow = vi.mocked(prisma.user.findUniqueOrThrow)
const mockUpdate            = vi.mocked(prisma.user.update)
const mockCompare           = vi.mocked(bcrypt.compare)
const mockHash              = vi.mocked(bcrypt.hash)

const STUB_USER = {
  id: 'u-1',
  email: 'mila@crm.com',
  role: 'OWNER' as const,
  displayName: 'Mila',
  avatarUrl: null,
  passwordHash: '$2b$10$hashedpassword',
}

beforeEach(() => vi.clearAllMocks())

// ─── login ────────────────────────────────────────────────────────────────────

describe('login', () => {
  it('throws "Invalid credentials" when the user does not exist', async () => {
    mockFindUnique.mockResolvedValue(null)
    await expect(login('nobody@crm.com', 'pw')).rejects.toThrow('Invalid credentials')
    // Must not call bcrypt — avoids timing difference between "no user" and "wrong pw"
    expect(mockCompare).not.toHaveBeenCalled()
  })

  it('throws "Invalid credentials" when the password is wrong', async () => {
    mockFindUnique.mockResolvedValue(STUB_USER as never)
    mockCompare.mockResolvedValue(false as never)
    await expect(login('mila@crm.com', 'wrong')).rejects.toThrow('Invalid credentials')
  })

  it('returns a token and safe user profile on valid credentials', async () => {
    mockFindUnique.mockResolvedValue(STUB_USER as never)
    mockCompare.mockResolvedValue(true as never)

    const result = await login('mila@crm.com', 'correct')

    expect(result.token).toBeDefined()
    expect(typeof result.token).toBe('string')
    expect(result.user.email).toBe('mila@crm.com')
    expect(result.user.role).toBe('OWNER')
    // passwordHash must never be in the returned user object
    expect(result.user).not.toHaveProperty('passwordHash')
  })

  it('issues a JWT that contains userId and role', async () => {
    mockFindUnique.mockResolvedValue(STUB_USER as never)
    mockCompare.mockResolvedValue(true as never)

    const { token } = await login('mila@crm.com', 'correct')

    // Decode (without verification) to inspect payload
    const [, payloadB64] = token.split('.')
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
    expect(payload.userId).toBe('u-1')
    expect(payload.role).toBe('OWNER')
  })

  it('uses a generic error message for both missing user and wrong password', async () => {
    // Missing user path
    mockFindUnique.mockResolvedValue(null)
    const err1 = await login('nobody@crm.com', 'pw').catch((e: Error) => e)

    // Wrong password path
    mockFindUnique.mockResolvedValue(STUB_USER as never)
    mockCompare.mockResolvedValue(false as never)
    const err2 = await login('mila@crm.com', 'wrong').catch((e: Error) => e)

    // Identical error messages prevent email enumeration
    expect((err1 as Error).message).toBe((err2 as Error).message)
  })
})

// ─── getMe ────────────────────────────────────────────────────────────────────

describe('getMe', () => {
  it('returns the safe user profile for a valid id', async () => {
    const safeUser = { id: 'u-1', email: 'mila@crm.com', role: 'OWNER', displayName: 'Mila', avatarUrl: null }
    mockFindUniqueOrThrow.mockResolvedValue(safeUser as never)

    const result = await getMe('u-1')

    expect(mockFindUniqueOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u-1' } })
    )
    expect(result.email).toBe('mila@crm.com')
    expect(result).not.toHaveProperty('passwordHash')
  })

  it('propagates the error when the user does not exist', async () => {
    mockFindUniqueOrThrow.mockRejectedValue(new Error('Not found'))
    await expect(getMe('ghost')).rejects.toThrow('Not found')
  })
})

// ─── changePassword ───────────────────────────────────────────────────────────

describe('changePassword', () => {
  it('throws "Invalid current password" when the current password is wrong', async () => {
    mockFindUniqueOrThrow.mockResolvedValue(STUB_USER as never)
    mockCompare.mockResolvedValue(false as never)

    await expect(changePassword('u-1', 'wrong', 'newpass')).rejects.toThrow('Invalid current password')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('hashes the new password and updates the record on success', async () => {
    mockFindUniqueOrThrow.mockResolvedValue(STUB_USER as never)
    mockCompare.mockResolvedValue(true as never)
    mockHash.mockResolvedValue('$2b$10$newhashedpassword' as never)
    mockUpdate.mockResolvedValue(STUB_USER as never)

    await changePassword('u-1', 'correct', 'newpassword')

    expect(mockHash).toHaveBeenCalledWith('newpassword', 10)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u-1' },
        data:  expect.objectContaining({ passwordHash: '$2b$10$newhashedpassword' }),
      })
    )
  })
})

// ─── changeEmail ──────────────────────────────────────────────────────────────

describe('changeEmail', () => {
  it('calls prisma.user.update with the new email and returns the safe profile', async () => {
    const updated = { ...STUB_USER, email: 'new@crm.com' }
    mockUpdate.mockResolvedValue(updated as never)

    const result = await changeEmail('u-1', 'new@crm.com')

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u-1' },
        data:  { email: 'new@crm.com' },
      })
    )
    expect(result.email).toBe('new@crm.com')
  })
})

// ─── updateAvatar ─────────────────────────────────────────────────────────────

describe('updateAvatar', () => {
  it('calls prisma.user.update with the new avatarUrl and returns the safe profile', async () => {
    const updated = { ...STUB_USER, avatarUrl: '/uploads/avatars/u-1.jpg' }
    mockUpdate.mockResolvedValue(updated as never)

    const result = await updateAvatar('u-1', '/uploads/avatars/u-1.jpg')

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u-1' },
        data:  { avatarUrl: '/uploads/avatars/u-1.jpg' },
      })
    )
    expect(result.avatarUrl).toBe('/uploads/avatars/u-1.jpg')
  })
})
