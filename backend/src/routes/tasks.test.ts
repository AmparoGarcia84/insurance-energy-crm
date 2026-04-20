/**
 * Integration tests for /tasks routes.
 *
 * Tasks have the most complex controller validation in the backend:
 * - reminder cross-field constraints (hasReminder → reminderAt + reminderChannel)
 * - polymorphic relation constraints (relatedEntityId ↔ relatedEntityType)
 * - rich query-param filters forwarded to the service
 *
 * All tests mock the service layer — no database connection required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../app.js'

vi.mock('../services/task.service.js', () => ({
  listTasks:  vi.fn(),
  getTaskById: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}))

import * as taskService from '../services/task.service.js'

const mockList    = vi.mocked(taskService.listTasks)
const mockGetById = vi.mocked(taskService.getTaskById)
const mockCreate  = vi.mocked(taskService.createTask)
const mockUpdate  = vi.mocked(taskService.updateTask)
const mockDelete  = vi.mocked(taskService.deleteTask)

function makeAuthCookie(userId: string, role: 'OWNER' | 'EMPLOYEE'): string {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '1h' })
  return `token=${token}`
}

const OWNER_COOKIE    = makeAuthCookie('u-owner', 'OWNER')
const EMPLOYEE_COOKIE = makeAuthCookie('u-emp',   'EMPLOYEE')

const STUB_TASK = {
  id: 't-001',
  subject: 'Follow up with client',
  status: 'PENDING',
  priority: 'MEDIUM',
  dueDate: null,
  hasReminder: false,
  assignedTo: null,
  client: null,
}

beforeEach(() => vi.clearAllMocks())

// ─── GET /tasks ───────────────────────────────────────────────────────────────

describe('GET /tasks', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/tasks')
    expect(res.status).toBe(401)
  })

  it('returns the task list for an authenticated user', async () => {
    mockList.mockResolvedValue([STUB_TASK] as never)
    const res = await request(app).get('/tasks').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].subject).toBe('Follow up with client')
  })

  it('passes status filter to the service', async () => {
    mockList.mockResolvedValue([] as never)
    await request(app).get('/tasks?status=DONE').set('Cookie', OWNER_COOKIE)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ status: 'DONE' }))
  })

  it('passes priority filter to the service', async () => {
    mockList.mockResolvedValue([] as never)
    await request(app).get('/tasks?priority=HIGH').set('Cookie', OWNER_COOKIE)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ priority: 'HIGH' }))
  })

  it('passes assignedToUserId filter to the service', async () => {
    mockList.mockResolvedValue([] as never)
    await request(app).get('/tasks?assignedToUserId=u-123').set('Cookie', OWNER_COOKIE)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ assignedToUserId: 'u-123' }))
  })

  it('passes clientId filter to the service', async () => {
    mockList.mockResolvedValue([] as never)
    await request(app).get('/tasks?clientId=c-001').set('Cookie', OWNER_COOKIE)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'c-001' }))
  })

  it('passes dueBefore filter to the service', async () => {
    mockList.mockResolvedValue([] as never)
    await request(app).get('/tasks?dueBefore=2025-01-31').set('Cookie', OWNER_COOKIE)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ dueBefore: '2025-01-31' }))
  })

  it('passes dueAfter filter to the service', async () => {
    mockList.mockResolvedValue([] as never)
    await request(app).get('/tasks?dueAfter=2025-01-01').set('Cookie', OWNER_COOKIE)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ dueAfter: '2025-01-01' }))
  })

  it('passes overdue=true as boolean true to the service', async () => {
    mockList.mockResolvedValue([] as never)
    await request(app).get('/tasks?overdue=true').set('Cookie', OWNER_COOKIE)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ overdue: true }))
  })

  it('passes hasReminder=true as boolean true to the service', async () => {
    mockList.mockResolvedValue([] as never)
    await request(app).get('/tasks?hasReminder=true').set('Cookie', OWNER_COOKIE)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ hasReminder: true }))
  })

  it('passes hasReminder=false as boolean false to the service', async () => {
    mockList.mockResolvedValue([] as never)
    await request(app).get('/tasks?hasReminder=false').set('Cookie', OWNER_COOKIE)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ hasReminder: false }))
  })

  it('works for EMPLOYEE role', async () => {
    mockList.mockResolvedValue([] as never)
    const res = await request(app).get('/tasks').set('Cookie', EMPLOYEE_COOKIE)
    expect(res.status).toBe(200)
  })
})

// ─── GET /tasks/:id ───────────────────────────────────────────────────────────

describe('GET /tasks/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/tasks/t-001')
    expect(res.status).toBe(401)
  })

  it('returns the task for a valid id', async () => {
    mockGetById.mockResolvedValue(STUB_TASK as never)
    const res = await request(app).get('/tasks/t-001').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('t-001')
  })

  it('returns 404 when the task does not exist', async () => {
    mockGetById.mockResolvedValue(null)
    const res = await request(app).get('/tasks/nonexistent').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(404)
  })
})

// ─── POST /tasks ──────────────────────────────────────────────────────────────

describe('POST /tasks — required field validation', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/tasks').send({ subject: 'X' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when subject is missing', async () => {
    const res = await request(app)
      .post('/tasks').set('Cookie', OWNER_COOKIE)
      .send({ status: 'PENDING' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when subject is an empty string', async () => {
    const res = await request(app)
      .post('/tasks').set('Cookie', OWNER_COOKIE)
      .send({ subject: '   ' })
    expect(res.status).toBe(400)
  })

  it('returns 201 with the created task on success', async () => {
    mockCreate.mockResolvedValue(STUB_TASK as never)
    const res = await request(app)
      .post('/tasks').set('Cookie', OWNER_COOKIE)
      .send({ subject: 'Follow up with client' })
    expect(res.status).toBe(201)
    expect(res.body.subject).toBe('Follow up with client')
  })

  it('EMPLOYEE can create a task', async () => {
    mockCreate.mockResolvedValue(STUB_TASK as never)
    const res = await request(app)
      .post('/tasks').set('Cookie', EMPLOYEE_COOKIE)
      .send({ subject: 'My task' })
    expect(res.status).toBe(201)
  })
})

describe('POST /tasks — reminder validation', () => {
  it('returns 400 when hasReminder=true but reminderAt is missing', async () => {
    const res = await request(app)
      .post('/tasks').set('Cookie', OWNER_COOKIE)
      .send({ subject: 'X', hasReminder: true, reminderChannel: 'EMAIL' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/reminderAt/)
  })

  it('returns 400 when hasReminder=true but reminderChannel is missing', async () => {
    const res = await request(app)
      .post('/tasks').set('Cookie', OWNER_COOKIE)
      .send({ subject: 'X', hasReminder: true, reminderAt: '2025-06-01T10:00:00Z' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/reminderChannel/)
  })

  it('returns 400 when reminderRecurrence is set without hasReminder', async () => {
    const res = await request(app)
      .post('/tasks').set('Cookie', OWNER_COOKIE)
      .send({ subject: 'X', reminderRecurrence: 'DAILY' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/reminderRecurrence/)
  })

  it('accepts a task with all reminder fields valid', async () => {
    mockCreate.mockResolvedValue({ ...STUB_TASK, hasReminder: true } as never)
    const res = await request(app)
      .post('/tasks').set('Cookie', OWNER_COOKIE)
      .send({
        subject: 'Remind me',
        hasReminder: true,
        reminderAt: '2025-06-01T10:00:00Z',
        reminderChannel: 'EMAIL',
      })
    expect(res.status).toBe(201)
  })
})

describe('POST /tasks — polymorphic relation validation', () => {
  it('returns 400 when relatedEntityId is set without relatedEntityType', async () => {
    const res = await request(app)
      .post('/tasks').set('Cookie', OWNER_COOKIE)
      .send({ subject: 'X', relatedEntityId: 'e-001' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/relatedEntityType/)
  })

  it('returns 400 when relatedEntityType is set without relatedEntityId', async () => {
    const res = await request(app)
      .post('/tasks').set('Cookie', OWNER_COOKIE)
      .send({ subject: 'X', relatedEntityType: 'SALE' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/relatedEntityId/)
  })

  it('accepts a task with both relatedEntityId and relatedEntityType', async () => {
    mockCreate.mockResolvedValue(STUB_TASK as never)
    const res = await request(app)
      .post('/tasks').set('Cookie', OWNER_COOKIE)
      .send({ subject: 'X', relatedEntityId: 'e-001', relatedEntityType: 'SALE' })
    expect(res.status).toBe(201)
  })
})

// ─── PATCH /tasks/:id ─────────────────────────────────────────────────────────

describe('PATCH /tasks/:id — update validation', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).patch('/tasks/t-001').send({ status: 'DONE' })
    expect(res.status).toBe(401)
  })

  it('returns 200 with the updated task on success', async () => {
    const updated = { ...STUB_TASK, status: 'DONE' }
    mockUpdate.mockResolvedValue(updated as never)
    const res = await request(app)
      .patch('/tasks/t-001').set('Cookie', OWNER_COOKIE)
      .send({ status: 'DONE' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('DONE')
  })

  it('returns 404 when the task does not exist', async () => {
    mockUpdate.mockRejectedValue(Object.assign(new Error('Not found'), { code: 'P2025' }))
    const res = await request(app)
      .patch('/tasks/nonexistent').set('Cookie', OWNER_COOKIE)
      .send({ status: 'DONE' })
    expect(res.status).toBe(404)
  })

  it('returns 400 when hasReminder=true but reminderAt is null in update', async () => {
    const res = await request(app)
      .patch('/tasks/t-001').set('Cookie', OWNER_COOKIE)
      .send({ hasReminder: true, reminderAt: null, reminderChannel: 'EMAIL' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when reminderRecurrence is set and hasReminder is explicitly false', async () => {
    const res = await request(app)
      .patch('/tasks/t-001').set('Cookie', OWNER_COOKIE)
      .send({ hasReminder: false, reminderRecurrence: 'DAILY' })
    expect(res.status).toBe(400)
  })
})

// ─── DELETE /tasks/:id ────────────────────────────────────────────────────────

describe('DELETE /tasks/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).delete('/tasks/t-001')
    expect(res.status).toBe(401)
  })

  it('returns 403 when the user is an EMPLOYEE', async () => {
    const res = await request(app).delete('/tasks/t-001').set('Cookie', EMPLOYEE_COOKIE)
    expect(res.status).toBe(403)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns 204 when the OWNER deletes a task', async () => {
    mockDelete.mockResolvedValue(undefined as never)
    const res = await request(app).delete('/tasks/t-001').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(204)
    expect(mockDelete).toHaveBeenCalledWith('t-001')
  })

  it('returns 404 when the task does not exist', async () => {
    mockDelete.mockRejectedValue(new Error('Not found'))
    const res = await request(app).delete('/tasks/nonexistent').set('Cookie', OWNER_COOKIE)
    expect(res.status).toBe(404)
  })
})
