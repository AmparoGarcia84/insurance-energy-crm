/**
 * Unit tests for task.service.ts
 *
 * The Prisma client is mocked so no database connection is required.
 * The main focus is on `buildWhere` (not exported directly) verified by
 * inspecting what gets passed to `prisma.task.findMany`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TaskStatus, TaskContextType, RelatedEntityType, TaskPriority } from '../generated/prisma/enums.js'

vi.mock('../db/prisma.js', () => ({
  default: {
    task: {
      findMany:  vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create:    vi.fn(),
      update:    vi.fn(),
      delete:    vi.fn(),
    },
  },
}))

import prisma from '../db/prisma.js'
import { listTasks, createTask, updateTask, deleteTask } from './task.service.js'

const mockFindMany  = vi.mocked(prisma.task.findMany)
const mockCreate    = vi.mocked(prisma.task.create)
const mockUpdate    = vi.mocked(prisma.task.update)
const mockDelete    = vi.mocked(prisma.task.delete)

beforeEach(() => vi.clearAllMocks())

// ─── buildWhere via listTasks ─────────────────────────────────────────────────

describe('listTasks — buildWhere filter logic', () => {
  it('calls findMany with empty where when no filters are provided', async () => {
    mockFindMany.mockResolvedValue([] as never)
    await listTasks()
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
  })

  it('applies status filter', async () => {
    mockFindMany.mockResolvedValue([] as never)
    await listTasks({ status: 'PENDING' as TaskStatus })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'PENDING' }) })
    )
  })

  it('applies priority filter', async () => {
    mockFindMany.mockResolvedValue([] as never)
    await listTasks({ priority: 'HIGH' as TaskPriority })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ priority: 'HIGH' }) })
    )
  })

  it('applies assignedToUserId filter', async () => {
    mockFindMany.mockResolvedValue([] as never)
    await listTasks({ assignedToUserId: 'u-123' })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ assignedToUserId: 'u-123' }) })
    )
  })

  it('applies clientId filter', async () => {
    mockFindMany.mockResolvedValue([] as never)
    await listTasks({ clientId: 'c-001' })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ clientId: 'c-001' }) })
    )
  })

  it('applies contextType filter', async () => {
    mockFindMany.mockResolvedValue([] as never)
    await listTasks({ contextType: 'SALE' as TaskContextType })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ contextType: 'SALE' }) })
    )
  })

  it('applies relatedEntityType filter', async () => {
    mockFindMany.mockResolvedValue([] as never)
    await listTasks({ relatedEntityType: 'POLICY' as RelatedEntityType })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ relatedEntityType: 'POLICY' }) })
    )
  })

  it('applies hasReminder: true filter', async () => {
    mockFindMany.mockResolvedValue([] as never)
    await listTasks({ hasReminder: true })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ hasReminder: true }) })
    )
  })

  it('applies hasReminder: false filter', async () => {
    mockFindMany.mockResolvedValue([] as never)
    await listTasks({ hasReminder: false })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ hasReminder: false }) })
    )
  })

  it('applies dueBefore as dueDate.lte', async () => {
    mockFindMany.mockResolvedValue([] as never)
    await listTasks({ dueBefore: '2025-03-31' })
    const call = mockFindMany.mock.calls[0][0] as { where: { dueDate?: { lte?: Date } } }
    expect(call.where.dueDate?.lte).toBeInstanceOf(Date)
    expect(call.where.dueDate?.lte?.toISOString()).toContain('2025-03-31')
  })

  it('applies dueAfter as dueDate.gte', async () => {
    mockFindMany.mockResolvedValue([] as never)
    await listTasks({ dueAfter: '2025-01-01' })
    const call = mockFindMany.mock.calls[0][0] as { where: { dueDate?: { gte?: Date } } }
    expect(call.where.dueDate?.gte).toBeInstanceOf(Date)
    expect(call.where.dueDate?.gte?.toISOString()).toContain('2025-01-01')
  })

  it('applies overdue: true as dueDate.lt = Date before now', async () => {
    mockFindMany.mockResolvedValue([] as never)
    const before = new Date()
    await listTasks({ overdue: true })
    const after = new Date()
    const call = mockFindMany.mock.calls[0][0] as { where: { dueDate?: { lt?: Date } } }
    expect(call.where.dueDate?.lt).toBeInstanceOf(Date)
    expect(call.where.dueDate?.lt!.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(call.where.dueDate?.lt!.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('combines multiple filters', async () => {
    mockFindMany.mockResolvedValue([] as never)
    await listTasks({ status: 'PENDING' as TaskStatus, priority: 'HIGH' as TaskPriority, clientId: 'c-001' })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PENDING',
          priority: 'HIGH',
          clientId: 'c-001',
        }),
      })
    )
  })

  it('orders by createdAt desc', async () => {
    mockFindMany.mockResolvedValue([] as never)
    await listTasks()
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } })
    )
  })
})

// ─── createTask ───────────────────────────────────────────────────────────────

describe('createTask', () => {
  it('calls prisma.task.create with the sanitized input', async () => {
    const stub = { id: 't-1', subject: 'Call client', assignedTo: null, client: null }
    mockCreate.mockResolvedValue(stub as never)

    const result = await createTask({ subject: 'Call client' })

    expect(mockCreate).toHaveBeenCalledOnce()
    expect(result).toEqual(stub)
  })

  it('converts empty string fields to undefined (sanitize)', async () => {
    mockCreate.mockResolvedValue({ id: 't-1', subject: 'X', assignedTo: null, client: null } as never)

    await createTask({ subject: 'X', description: '' })

    const callArg = (mockCreate.mock.calls[0][0] as { data: Record<string, unknown> }).data
    // Empty string → undefined (not stored)
    expect(callArg.description).toBeUndefined()
  })

  it('converts date string fields to Date objects (sanitize)', async () => {
    mockCreate.mockResolvedValue({ id: 't-1', subject: 'X', assignedTo: null, client: null } as never)

    await createTask({ subject: 'X', dueDate: '2025-06-01' })

    const callArg = (mockCreate.mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(callArg.dueDate).toBeInstanceOf(Date)
  })
})

// ─── updateTask ───────────────────────────────────────────────────────────────

describe('updateTask', () => {
  it('calls prisma.task.update with the given id and sanitized data', async () => {
    const stub = { id: 't-1', subject: 'Updated', assignedTo: null, client: null }
    mockUpdate.mockResolvedValue(stub as never)

    const result = await updateTask('t-1', { subject: 'Updated' })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 't-1' } })
    )
    expect(result).toEqual(stub)
  })
})

// ─── deleteTask ───────────────────────────────────────────────────────────────

describe('deleteTask', () => {
  it('calls prisma.task.delete with the given id', async () => {
    mockDelete.mockResolvedValue(undefined as never)
    await deleteTask('t-1')
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 't-1' } })
  })
})
