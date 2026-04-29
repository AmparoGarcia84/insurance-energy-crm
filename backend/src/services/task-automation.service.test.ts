/**
 * Unit tests for task-automation.service.ts
 * createTask is mocked — no database connection required.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('./task.service.js', () => ({
  createTask: vi.fn().mockResolvedValue({}),
}))

import * as taskService from './task.service.js'
import { createTaskForNewCase } from './task-automation.service.js'

const mockCreateTask = vi.mocked(taskService.createTask)

beforeEach(() => vi.clearAllMocks())

// Fixed "today" so dueDate assertions are deterministic
const FIXED_NOW = new Date('2026-04-29T12:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

// ── createTaskForNewCase ──────────────────────────────────────────────────────

describe('createTaskForNewCase', () => {
  it('creates a task with the correct subject and description for a typed case', async () => {
    await createTaskForNewCase({
      caseId:          'case-001',
      caseName:        'Rotura de tubería',
      caseType:        'CLAIM',
      createdByUserId: 'u-mila',
    })

    expect(mockCreateTask).toHaveBeenCalledOnce()
    const call = mockCreateTask.mock.calls[0][0]
    expect(call.subject).toBe('Revisión de caso - Rotura de tubería')
    expect(call.description).toBe('Iniciar solución para el Siniestro')
  })

  it('uses "caso" in description when caseType is null', async () => {
    await createTaskForNewCase({
      caseId:   'case-002',
      caseName: 'Gestión genérica',
      caseType: null,
    })

    const call = mockCreateTask.mock.calls[0][0]
    expect(call.description).toBe('Iniciar solución para el caso')
  })

  it('uses "caso" in description when caseType is undefined', async () => {
    await createTaskForNewCase({
      caseId:   'case-003',
      caseName: 'Sin tipo',
    })

    const call = mockCreateTask.mock.calls[0][0]
    expect(call.description).toBe('Iniciar solución para el caso')
  })

  it('sets status NOT_STARTED', async () => {
    await createTaskForNewCase({ caseId: 'case-001', caseName: 'Test' })
    expect(mockCreateTask.mock.calls[0][0].status).toBe('NOT_STARTED')
  })

  it('sets dueDate to 3 months from today', async () => {
    await createTaskForNewCase({ caseId: 'case-001', caseName: 'Test' })
    expect(mockCreateTask.mock.calls[0][0].dueDate).toBe('2026-07-29')
  })

  it('links caseId on the task', async () => {
    await createTaskForNewCase({ caseId: 'case-001', caseName: 'Test' })
    expect(mockCreateTask.mock.calls[0][0].caseId).toBe('case-001')
  })

  it('assigns the task to createdByUserId when provided', async () => {
    await createTaskForNewCase({
      caseId:          'case-001',
      caseName:        'Test',
      createdByUserId: 'u-mila',
    })
    expect(mockCreateTask.mock.calls[0][0].assignedToUserId).toBe('u-mila')
  })

  it('leaves assignedToUserId undefined when createdByUserId is null', async () => {
    await createTaskForNewCase({
      caseId:          'case-001',
      caseName:        'Test',
      createdByUserId: null,
    })
    expect(mockCreateTask.mock.calls[0][0].assignedToUserId).toBeUndefined()
  })

  it('sets providerSupplierId from the case supplier when provided', async () => {
    await createTaskForNewCase({
      caseId:             'case-001',
      caseName:           'Test',
      providerSupplierId: 'sup-001',
    })
    expect(mockCreateTask.mock.calls[0][0].providerSupplierId).toBe('sup-001')
  })

  it('leaves providerSupplierId undefined when the case has no supplier', async () => {
    await createTaskForNewCase({
      caseId:             'case-001',
      caseName:           'Test',
      providerSupplierId: null,
    })
    expect(mockCreateTask.mock.calls[0][0].providerSupplierId).toBeUndefined()
  })

  it('does not throw when createTask rejects — errors are swallowed', async () => {
    mockCreateTask.mockRejectedValueOnce(new Error('DB error'))
    await expect(
      createTaskForNewCase({ caseId: 'case-001', caseName: 'Test' })
    ).resolves.toBeUndefined()
  })

  it('sets correct labels for all CaseType values', async () => {
    const cases: Array<['CLAIM' | 'FAULT' | 'ACTIVATION' | 'WRONG_SETTLEMENT', string]> = [
      ['CLAIM',            'Siniestro'],
      ['FAULT',            'Avería'],
      ['ACTIVATION',       'Activación'],
      ['WRONG_SETTLEMENT', 'Liquidación errónea'],
    ]

    for (const [type, label] of cases) {
      vi.clearAllMocks()
      await createTaskForNewCase({ caseId: 'x', caseName: 'x', caseType: type })
      expect(mockCreateTask.mock.calls[0][0].description).toBe(`Iniciar solución para el ${label}`)
    }
  })
})
