/**
 * Unit tests for task.service.ts
 *
 * The Prisma client is mocked so no database connection is required.
 * Tests cover: buildWhere filters, sanitize (empty string / date conversion),
 * and the cascade hierarchy resolution (caseId → saleId → clientId).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TaskStatus, TaskContextType, TaskPriority } from '../generated/prisma/enums.js'

vi.mock('../db/prisma.js', () => ({
  default: {
    task: {
      findMany:   vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create:     vi.fn(),
      update:     vi.fn(),
      delete:     vi.fn(),
    },
    case: {
      findUniqueOrThrow: vi.fn(),
    },
    sale: {
      findUniqueOrThrow: vi.fn(),
    },
  },
}))

import prisma from '../db/prisma.js'
import { listTasks, createTask, updateTask, deleteTask } from './task.service.js'

const mockFindMany  = vi.mocked(prisma.task.findMany)
const mockCreate    = vi.mocked(prisma.task.create)
const mockUpdate    = vi.mocked(prisma.task.update)
const mockDelete    = vi.mocked(prisma.task.delete)
const mockCaseFind  = vi.mocked(prisma.case.findUniqueOrThrow)
const mockSaleFind  = vi.mocked(prisma.sale.findUniqueOrThrow)

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

  it('applies saleId filter', async () => {
    mockFindMany.mockResolvedValue([] as never)
    await listTasks({ saleId: 's-001' })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ saleId: 's-001' }) })
    )
  })

  it('applies caseId filter', async () => {
    mockFindMany.mockResolvedValue([] as never)
    await listTasks({ caseId: 'case-001' })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ caseId: 'case-001' }) })
    )
  })

  it('applies contextType filter', async () => {
    mockFindMany.mockResolvedValue([] as never)
    await listTasks({ contextType: 'CONTACT' as TaskContextType })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ contextType: 'CONTACT' }) })
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

// ─── Cascade hierarchy resolution ────────────────────────────────────────────

describe('createTask — cascade hierarchy resolution', () => {
  it('resolves saleId and clientId from caseId', async () => {
    mockCaseFind.mockResolvedValue({ saleId: 's-001', clientId: 'c-001' } as never)
    const stub = { id: 't-1', subject: 'X', assignedTo: null, client: null, sale: null, case: null }
    mockCreate.mockResolvedValue(stub as never)

    await createTask({ subject: 'X', caseId: 'case-001' })

    expect(mockCaseFind).toHaveBeenCalledWith({ where: { id: 'case-001' }, select: { saleId: true, clientId: true } })
    const data = (mockCreate.mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(data.caseId).toBe('case-001')
    expect(data.saleId).toBe('s-001')
    expect(data.clientId).toBe('c-001')
  })

  it('resolves clientId from saleId (no caseId)', async () => {
    mockSaleFind.mockResolvedValue({ clientId: 'c-001' } as never)
    const stub = { id: 't-1', subject: 'X', assignedTo: null, client: null, sale: null, case: null }
    mockCreate.mockResolvedValue(stub as never)

    await createTask({ subject: 'X', saleId: 's-001' })

    expect(mockSaleFind).toHaveBeenCalledWith({ where: { id: 's-001' }, select: { clientId: true } })
    const data = (mockCreate.mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(data.saleId).toBe('s-001')
    expect(data.clientId).toBe('c-001')
    expect(data.caseId).toBeUndefined()
  })

  it('uses clientId directly when no caseId or saleId', async () => {
    const stub = { id: 't-1', subject: 'X', assignedTo: null, client: null, sale: null, case: null }
    mockCreate.mockResolvedValue(stub as never)

    await createTask({ subject: 'X', clientId: 'c-001' })

    expect(mockCaseFind).not.toHaveBeenCalled()
    expect(mockSaleFind).not.toHaveBeenCalled()
    const data = (mockCreate.mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(data.clientId).toBe('c-001')
  })
})

// ─── createTask — sanitize ────────────────────────────────────────────────────

describe('createTask', () => {
  it('calls prisma.task.create with the sanitized input', async () => {
    const stub = { id: 't-1', subject: 'Call client', assignedTo: null, client: null, sale: null, case: null }
    mockCreate.mockResolvedValue(stub as never)

    const result = await createTask({ subject: 'Call client' })

    expect(mockCreate).toHaveBeenCalledOnce()
    expect(result).toEqual(stub)
  })

  it('converts empty string fields to undefined (sanitize)', async () => {
    mockCreate.mockResolvedValue({ id: 't-1', subject: 'X', assignedTo: null, client: null, sale: null, case: null } as never)

    await createTask({ subject: 'X', description: '' })

    const callArg = (mockCreate.mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(callArg.description).toBeUndefined()
  })

  it('converts date string fields to Date objects (sanitize)', async () => {
    mockCreate.mockResolvedValue({ id: 't-1', subject: 'X', assignedTo: null, client: null, sale: null, case: null } as never)

    await createTask({ subject: 'X', dueDate: '2025-06-01' })

    const callArg = (mockCreate.mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(callArg.dueDate).toBeInstanceOf(Date)
  })
})

// ─── updateTask ───────────────────────────────────────────────────────────────

describe('updateTask', () => {
  it('calls prisma.task.update with the given id and sanitized data', async () => {
    const stub = { id: 't-1', subject: 'Updated', assignedTo: null, client: null, sale: null, case: null }
    mockUpdate.mockResolvedValue(stub as never)

    const result = await updateTask('t-1', { subject: 'Updated' })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 't-1' } })
    )
    expect(result).toEqual(stub)
  })

  it('re-runs cascade when saleId changes in update', async () => {
    mockSaleFind.mockResolvedValue({ clientId: 'c-new' } as never)
    const stub = { id: 't-1', subject: 'X', assignedTo: null, client: null, sale: null, case: null }
    mockUpdate.mockResolvedValue(stub as never)

    await updateTask('t-1', { saleId: 's-new' })

    expect(mockSaleFind).toHaveBeenCalledWith({ where: { id: 's-new' }, select: { clientId: true } })
    const data = (mockUpdate.mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(data.saleId).toBe('s-new')
    expect(data.clientId).toBe('c-new')
  })

  it('skips cascade when no hierarchy field is in the update', async () => {
    const stub = { id: 't-1', subject: 'Updated', assignedTo: null, client: null, sale: null, case: null }
    mockUpdate.mockResolvedValue(stub as never)

    await updateTask('t-1', { subject: 'Updated' })

    expect(mockCaseFind).not.toHaveBeenCalled()
    expect(mockSaleFind).not.toHaveBeenCalled()
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
