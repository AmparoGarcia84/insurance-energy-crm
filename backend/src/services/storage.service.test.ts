/**
 * storage.service.test.ts
 *
 * Unit tests for the R2 storage service.
 * The S3Client is mocked so no real network calls are made.
 * vi.stubEnv controls env vars per-test without module reloads.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isConfigured, uploadFile, deleteFile } from './storage.service.js'

// ── Mock @aws-sdk/client-s3 ───────────────────────────────────────────────────

const mockSend = vi.fn()

vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: vi.fn(function(this: { send: typeof mockSend }) {
      this.send = mockSend
    }),
    PutObjectCommand: vi.fn(function(this: object, input: unknown) {
      Object.assign(this as object, { input })
    }),
    DeleteObjectCommand: vi.fn(function(this: object, input: unknown) {
      Object.assign(this as object, { input })
    }),
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

const R2_VARS = {
  R2_ACCOUNT_ID: 'test-account',
  R2_ACCESS_KEY_ID: 'test-key',
  R2_SECRET_ACCESS_KEY: 'test-secret',
  R2_BUCKET_NAME: 'test-bucket',
  R2_PUBLIC_URL: 'https://pub-test.r2.dev',
}

function stubR2Env(overrides: Partial<typeof R2_VARS> = {}) {
  const vars = { ...R2_VARS, ...overrides }
  for (const [k, v] of Object.entries(vars)) {
    vi.stubEnv(k, v)
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('storage.service', () => {
  beforeEach(() => {
    mockSend.mockReset()
    vi.unstubAllEnvs()
  })

  // ── isConfigured ────────────────────────────────────────────────────────────

  describe('isConfigured()', () => {
    it('returns true when all R2 env vars are present', () => {
      stubR2Env()
      expect(isConfigured()).toBe(true)
    })

    it('returns false when R2_ACCOUNT_ID is missing', () => {
      stubR2Env()
      vi.stubEnv('R2_ACCOUNT_ID', '')
      expect(isConfigured()).toBe(false)
    })

    it('returns false when R2_PUBLIC_URL is missing', () => {
      stubR2Env()
      vi.stubEnv('R2_PUBLIC_URL', '')
      expect(isConfigured()).toBe(false)
    })

    it('returns false when no env vars are set', () => {
      expect(isConfigured()).toBe(false)
    })
  })

  // ── uploadFile ───────────────────────────────────────────────────────────────

  describe('uploadFile()', () => {
    it('sends PutObjectCommand with correct params and returns public URL', async () => {
      stubR2Env()
      mockSend.mockResolvedValue({})

      const buffer = Buffer.from('test-image')
      const url = await uploadFile(buffer, 'avatars/u-1.jpg', 'image/jpeg')

      expect(mockSend).toHaveBeenCalledOnce()
      const [cmd] = mockSend.mock.calls[0] as [{ input: unknown }][]
      expect((cmd as unknown as { input: unknown }).input).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'avatars/u-1.jpg',
        Body: buffer,
        ContentType: 'image/jpeg',
      })
      expect(url).toBe('https://pub-test.r2.dev/avatars/u-1.jpg')
    })

    it('throws when R2 is not configured', async () => {
      await expect(
        uploadFile(Buffer.from('x'), 'avatars/x.jpg', 'image/jpeg'),
      ).rejects.toThrow('R2 storage is not configured')
    })
  })

  // ── deleteFile ───────────────────────────────────────────────────────────────

  describe('deleteFile()', () => {
    it('sends DeleteObjectCommand with the correct key extracted from a full URL', async () => {
      stubR2Env()
      mockSend.mockResolvedValue({})

      await deleteFile('https://pub-test.r2.dev/documents/file.pdf')

      expect(mockSend).toHaveBeenCalledOnce()
      const [cmd] = mockSend.mock.calls[0] as [{ input: unknown }][]
      expect((cmd as unknown as { input: unknown }).input).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'documents/file.pdf',
      })
    })

    it('sends DeleteObjectCommand with a bare key', async () => {
      stubR2Env()
      mockSend.mockResolvedValue({})

      await deleteFile('avatars/u-1.jpg')

      const [cmd] = mockSend.mock.calls[0] as [{ input: unknown }][]
      expect((cmd as unknown as { input: unknown }).input).toMatchObject({
        Key: 'avatars/u-1.jpg',
      })
    })

    it('does nothing when urlOrKey is null', async () => {
      stubR2Env()
      await deleteFile(null)
      expect(mockSend).not.toHaveBeenCalled()
    })

    it('does nothing when urlOrKey is undefined', async () => {
      stubR2Env()
      await deleteFile(undefined)
      expect(mockSend).not.toHaveBeenCalled()
    })

    it('does nothing when R2 is not configured', async () => {
      await deleteFile('avatars/u-1.jpg')
      expect(mockSend).not.toHaveBeenCalled()
    })
  })
})
