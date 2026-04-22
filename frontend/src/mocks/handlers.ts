/**
 * mocks/handlers.ts — MSW request handlers for demo mode
 *
 * Intercepts all API calls made by the frontend and returns seed data or
 * performs in-memory mutations. The store resets to the original seed data
 * on every page load, which is the expected demo behaviour.
 *
 * Endpoints covered:
 *  Auth    POST /auth/login  GET /auth/me  POST /auth/logout
 *  Clients GET/POST/PUT/DELETE /clients
 *  Sales   GET/POST/PUT/DELETE /sales
 *  Users   GET/POST/DELETE /admin/users
 *  Collab. GET/POST/PUT/DELETE /collaborators
 *  Tasks   GET /tasks  (read-only; mutations not yet in the UI)
 *  Docs    GET/POST/PATCH/DELETE /documents
 */

import { http, HttpResponse } from 'msw'
import type { AuthUser } from '../api/auth'
import type { Client, ClientInput } from '../api/clients'
import type { Sale, SaleInput } from '../api/sales'
import type { Collaborator, CollaboratorInput } from '../api/collaborators'
import type { TaskWithRelations } from '../api/tasks'
import { TaskStatus } from '../api/tasks'
import type { DocumentRecord } from '../api/documents'
import type { ActivityWithRelations } from '../api/activities'
import type { Case, CaseInput } from '../api/cases'
import {
  DEMO_USERS, DEMO_CREDENTIALS,
  DEMO_CLIENTS, DEMO_SALES, DEMO_COLLABORATORS,
  DEMO_TASKS, DEMO_DOCUMENTS, DEMO_ACTIVITIES, DEMO_CASES,
} from './seedData'

// ── In-memory store (reset on every page load) ────────────────────────────────

const store = {
  currentUser: null as AuthUser | null,
  clients:     structuredClone(DEMO_CLIENTS)     as Client[],
  sales:       structuredClone(DEMO_SALES)       as Sale[],
  users:       structuredClone(DEMO_USERS)       as AuthUser[],
  collaborators: structuredClone(DEMO_COLLABORATORS) as Collaborator[],
  tasks:       structuredClone(DEMO_TASKS)       as TaskWithRelations[],
  documents:   structuredClone(DEMO_DOCUMENTS)   as DocumentRecord[],
  activities:  structuredClone(DEMO_ACTIVITIES)  as ActivityWithRelations[],
  cases:       structuredClone(DEMO_CASES)       as Case[],
}

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// ── Auth ──────────────────────────────────────────────────────────────────────

const authHandlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    const user = store.users.find(u => u.email === body.email)
    if (!user || DEMO_CREDENTIALS[body.email] !== body.password) {
      return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    store.currentUser = user
    return HttpResponse.json({ user })
  }),

  http.get(`${API}/auth/me`, () => {
    if (!store.currentUser) return new HttpResponse(null, { status: 401 })
    return HttpResponse.json(store.currentUser)
  }),

  http.post(`${API}/auth/logout`, () => {
    store.currentUser = null
    return new HttpResponse(null, { status: 204 })
  }),

  // Password/email/avatar changes — accept silently in demo
  http.patch(`${API}/auth/password`, () => new HttpResponse(null, { status: 204 })),
  http.patch(`${API}/auth/email`, () => {
    if (!store.currentUser) return new HttpResponse(null, { status: 401 })
    return HttpResponse.json({ user: store.currentUser })
  }),
  http.post(`${API}/auth/avatar`, () => {
    if (!store.currentUser) return new HttpResponse(null, { status: 401 })
    return HttpResponse.json({ user: store.currentUser })
  }),
]

// ── Clients ───────────────────────────────────────────────────────────────────

const clientHandlers = [
  http.get(`${API}/clients`, () =>
    HttpResponse.json(store.clients),
  ),

  http.get(`${API}/clients/:id`, ({ params }) => {
    const client = store.clients.find(c => c.id === params.id)
    if (!client) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(client)
  }),

  http.post(`${API}/clients`, async ({ request }) => {
    const data = await request.json() as ClientInput
    const now = new Date().toISOString()
    const next = String(store.clients.length + 1).padStart(6, '0')
    const newClient: Client = {
      ...data, id: `c-new-${Date.now()}`,
      clientNumber: next, createdAt: now, updatedAt: now,
    }
    store.clients.push(newClient)
    store.clients.sort((a, b) => a.name.localeCompare(b.name))
    return HttpResponse.json(newClient, { status: 201 })
  }),

  http.put(`${API}/clients/:id`, async ({ params, request }) => {
    const idx = store.clients.findIndex(c => c.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const data = await request.json() as Partial<ClientInput>
    const updated: Client = { ...store.clients[idx], ...data, updatedAt: new Date().toISOString() }
    store.clients[idx] = updated
    return HttpResponse.json(updated)
  }),

  http.delete(`${API}/clients/:id`, ({ params }) => {
    const idx = store.clients.findIndex(c => c.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    store.clients.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // CSV import — return mock result
  http.post(`${API}/clients/import`, () =>
    HttpResponse.json({ created: 0, skipped: 0, errors: ['Import not available in demo mode'] }),
  ),
]

// ── Sales ─────────────────────────────────────────────────────────────────────

const salesHandlers = [
  http.get(`${API}/sales`, () =>
    HttpResponse.json(store.sales),
  ),

  http.post(`${API}/sales`, async ({ request }) => {
    const data = await request.json() as SaleInput
    const now = new Date().toISOString()
    const newSale: Sale = { ...data, id: `s-new-${Date.now()}`, createdAt: now, updatedAt: now }
    store.sales.push(newSale)
    return HttpResponse.json(newSale, { status: 201 })
  }),

  http.put(`${API}/sales/:id`, async ({ params, request }) => {
    const idx = store.sales.findIndex(s => s.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const data = await request.json() as Partial<SaleInput>
    const updated: Sale = { ...store.sales[idx], ...data, updatedAt: new Date().toISOString() }
    store.sales[idx] = updated
    return HttpResponse.json(updated)
  }),

  http.delete(`${API}/sales/:id`, ({ params }) => {
    const idx = store.sales.findIndex(s => s.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    store.sales.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

// ── Users ─────────────────────────────────────────────────────────────────────

const usersHandlers = [
  http.get(`${API}/admin/users`, () =>
    HttpResponse.json(store.users),
  ),

  http.post(`${API}/admin/users`, async ({ request }) => {
    const data = await request.json() as { displayName: string; email: string; role: 'OWNER' | 'EMPLOYEE'; password: string }
    const newUser: AuthUser = {
      id: `u-new-${Date.now()}`, email: data.email,
      role: data.role, displayName: data.displayName, avatarUrl: null,
    }
    store.users.push(newUser)
    return HttpResponse.json({ user: newUser }, { status: 201 })
  }),

  http.delete(`${API}/admin/users/:id`, ({ params }) => {
    const idx = store.users.findIndex(u => u.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    store.users.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

// ── Collaborators ─────────────────────────────────────────────────────────────

const BASE_COLLAB = `${API}/collaborators`

const collaboratorHandlers = [
  http.get(BASE_COLLAB, () =>
    HttpResponse.json(store.collaborators),
  ),

  http.post(BASE_COLLAB, async ({ request }) => {
    const data = await request.json() as CollaboratorInput
    const now = new Date().toISOString()
    const newCol: Collaborator = { ...data, id: `col-new-${Date.now()}`, createdAt: now, updatedAt: now }
    store.collaborators.push(newCol)
    return HttpResponse.json(newCol, { status: 201 })
  }),

  http.put(`${BASE_COLLAB}/:id`, async ({ params, request }) => {
    const idx = store.collaborators.findIndex(c => c.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const data = await request.json() as Partial<CollaboratorInput>
    const updated: Collaborator = { ...store.collaborators[idx], ...data, updatedAt: new Date().toISOString() }
    store.collaborators[idx] = updated
    return HttpResponse.json(updated)
  }),

  http.delete(`${BASE_COLLAB}/:id`, ({ params }) => {
    const idx = store.collaborators.findIndex(c => c.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    store.collaborators.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

// ── Tasks ─────────────────────────────────────────────────────────────────────

const PENDING_STATUSES = new Set<string>([
  TaskStatus.NOT_STARTED, TaskStatus.IN_PROGRESS,
  TaskStatus.DEFERRED, TaskStatus.WAITING_FOR_INPUT, TaskStatus.UNLOGGED,
])

const tasksHandlers = [
  http.get(`${API}/tasks`, ({ request }) => {
    const url = new URL(request.url)
    let tasks: TaskWithRelations[] = store.tasks

    const clientId  = url.searchParams.get('clientId')
    const status    = url.searchParams.get('status')
    const assignedTo = url.searchParams.get('assignedToUserId')
    const overdue   = url.searchParams.get('overdue')

    const hasReminder = url.searchParams.get('hasReminder')

    if (clientId)             tasks = tasks.filter(t => t.clientId === clientId)
    if (status)               tasks = tasks.filter(t => t.status === status)
    if (assignedTo)           tasks = tasks.filter(t => t.assignedToUserId === assignedTo)
    if (hasReminder !== null) tasks = tasks.filter(t => t.hasReminder === (hasReminder === 'true'))
    if (overdue === 'true') {
      const today = new Date().toDateString()
      tasks = tasks.filter(t =>
        t.dueDate && new Date(t.dueDate) < new Date(today) && PENDING_STATUSES.has(t.status),
      )
    }

    return HttpResponse.json(tasks)
  }),
]

// ── Documents ─────────────────────────────────────────────────────────────────

const documentsHandlers = [
  http.get(`${API}/documents`, ({ request }) => {
    const url = new URL(request.url)
    let docs: DocumentRecord[] = store.documents

    const clientId = url.searchParams.get('clientId')
    const saleId   = url.searchParams.get('saleId')

    if (clientId) docs = docs.filter(d => d.clientId === clientId)
    if (saleId)   docs = docs.filter(d => d.saleId   === saleId)

    return HttpResponse.json(docs)
  }),

  http.post(`${API}/documents`, async ({ request }) => {
    const formData = await request.formData()
    const now = new Date().toISOString()
    const newDoc: DocumentRecord = {
      id:               `d-new-${Date.now()}`,
      name:             String(formData.get('name') ?? ''),
      group:            formData.get('group') as DocumentRecord['group'],
      documentType:     formData.get('documentType') as DocumentRecord['documentType'],
      status:           formData.get('status') as DocumentRecord['status'],
      includedAt:       String(formData.get('includedAt') ?? now),
      expiryDate:       formData.get('expiryDate') ? String(formData.get('expiryDate')) : null,
      fileUrl:          null,
      clientId:         String(formData.get('clientId') ?? ''),
      saleId:           formData.get('saleId') ? String(formData.get('saleId')) : null,
      uploadedByUserId: store.currentUser?.id ?? null,
      createdAt:        now,
      updatedAt:        now,
    }
    store.documents.push(newDoc)
    return HttpResponse.json(newDoc, { status: 201 })
  }),

  http.patch(`${API}/documents/:id`, async ({ params, request }) => {
    const idx = store.documents.findIndex(d => d.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const formData = await request.formData()
    const updated: DocumentRecord = {
      ...store.documents[idx],
      updatedAt: new Date().toISOString(),
    }
    if (formData.get('name'))         updated.name         = String(formData.get('name'))
    if (formData.get('status'))       updated.status       = formData.get('status') as DocumentRecord['status']
    if (formData.get('expiryDate'))   updated.expiryDate   = String(formData.get('expiryDate'))
    store.documents[idx] = updated
    return HttpResponse.json(updated)
  }),

  http.delete(`${API}/documents/:id`, ({ params }) => {
    const idx = store.documents.findIndex(d => d.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    store.documents.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

// ── Activities ────────────────────────────────────────────────────────────────

const activityHandlers = [
  http.get(`${API}/activities`, ({ request }) => {
    const url    = new URL(request.url)
    const clientId = url.searchParams.get('clientId')
    const saleId   = url.searchParams.get('saleId')
    const type     = url.searchParams.get('type')
    let results = store.activities
    if (clientId) results = results.filter(a => a.clientId === clientId)
    if (saleId)   results = results.filter(a => a.saleId   === saleId)
    if (type)     results = results.filter(a => a.type     === type)
    const sorted = [...results].sort(
      (a, b) => new Date(b.activityAt).getTime() - new Date(a.activityAt).getTime()
    )
    return HttpResponse.json(sorted)
  }),

  http.get(`${API}/activities/:id`, ({ params }) => {
    const activity = store.activities.find(a => a.id === params.id)
    if (!activity) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(activity)
  }),

  http.post(`${API}/activities`, async ({ request }) => {
    if (!store.currentUser) return new HttpResponse(null, { status: 401 })
    const body = await request.json() as Partial<ActivityWithRelations>
    const now = new Date().toISOString()
    const newActivity: ActivityWithRelations = {
      id:          `act-${Date.now()}`,
      userId:      store.currentUser.id,
      clientId:    body.clientId ?? '',
      saleId:      body.saleId,
      type:        body.type!,
      direction:   body.direction,
      subject:     body.subject ?? '',
      description: body.description,
      outcome:     body.outcome,
      nextStep:    body.nextStep,
      activityAt:  body.activityAt ?? now,
      createdAt:   now,
      updatedAt:   now,
      user:        { id: store.currentUser.id, displayName: store.currentUser.displayName },
    }
    store.activities.unshift(newActivity)
    return HttpResponse.json(newActivity, { status: 201 })
  }),

  http.patch(`${API}/activities/:id`, async ({ params, request }) => {
    const idx = store.activities.findIndex(a => a.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const body = await request.json() as Partial<ActivityWithRelations>
    const updated: ActivityWithRelations = {
      ...store.activities[idx],
      ...body,
      updatedAt: new Date().toISOString(),
    }
    store.activities[idx] = updated
    return HttpResponse.json(updated)
  }),

  http.delete(`${API}/activities/:id`, ({ params }) => {
    const idx = store.activities.findIndex(a => a.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    store.activities.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

// ── Dashboard ─────────────────────────────────────────────────────────────────

const INSURANCE_OPEN_STAGES = new Set([
  'RESPONSE_PENDING', 'DOCUMENTS_PENDING', 'SIGNATURE_PENDING', 'ISSUANCE_PENDING',
  'BILLING_THIS_MONTH', 'BILLING_NEXT_MONTH', 'RECURRENT_BILLING',
  'INVOICE_PENDING_PAYMENT', 'WRONG_SETTLEMENT',
])
const ENERGY_OPEN_STAGES = new Set([
  'RESPONSE_PENDING', 'DOCUMENTS_PENDING', 'SIGNATURE_PENDING',
  'ACTIVATION_PENDING', 'BILLING_THIS_MONTH',
])

function monthRange(year: number, month: number) {
  const gte = new Date(year, month, 1).toISOString()
  const lt  = new Date(year, month + 1, 1).toISOString()
  return { gte, lt }
}
function inRange(iso: string | null | undefined, range: { gte: string; lt: string }): boolean {
  if (!iso) return false
  return iso >= range.gte && iso < range.lt
}
function sumAmount(sales: Sale[]): number {
  return sales.reduce((acc, s) => acc + (s.amount ?? 0), 0)
}
function deltaPercent(cur: number, prev: number): number | null {
  if (prev === 0) return null
  return Math.round(((cur - prev) / prev) * 100)
}

const dashboardHandlers = [
  http.get(`${API}/dashboard/summary`, () => {
    const now = new Date()
    const ty = now.getFullYear(), tm = now.getMonth()
    const ly = tm === 0 ? ty - 1 : ty, lm = tm === 0 ? 11 : tm - 1

    const thisRange = monthRange(ty, tm)
    const lastRange = monthRange(ly, lm)

    const toCollectThis = store.sales.filter(s => inRange(s.billingDate ?? null, thisRange))
    const collectedThis = toCollectThis.filter(
      s => s.insuranceStage === 'BILLED_AND_PAID' || s.energyStage === 'BILLED_AND_PAID'
    )
    const toCollectLast = store.sales.filter(s => inRange(s.billingDate ?? null, lastRange))
    const collectedLast = toCollectLast.filter(
      s => s.insuranceStage === 'BILLED_AND_PAID' || s.energyStage === 'BILLED_AND_PAID'
    )
    const newSalesThis  = store.sales.filter(s => inRange(s.createdAt, thisRange)).length
    const newSalesLast  = store.sales.filter(s => inRange(s.createdAt, lastRange)).length
    const newClientsThis = store.clients.filter(c => inRange(c.createdAt, thisRange)).length
    const newClientsLast = store.clients.filter(c => inRange(c.createdAt, lastRange)).length

    let openCount = 0, openValue = 0, insuranceOpenCount = 0, energyOpenCount = 0
    for (const s of store.sales) {
      let open = false
      if (s.type === 'INSURANCE' && s.insuranceStage && INSURANCE_OPEN_STAGES.has(s.insuranceStage)) {
        open = true; insuranceOpenCount++
      } else if (s.type === 'ENERGY' && s.energyStage && ENERGY_OPEN_STAGES.has(s.energyStage)) {
        open = true; energyOpenCount++
      }
      if (open) { openCount++; openValue += s.expectedRevenue ?? s.amount ?? 0 }
    }

    const recentActivities = [...store.activities]
      .sort((a, b) => b.activityAt.localeCompare(a.activityAt))
      .slice(0, 8)
      .map(a => ({
        id:         a.id,
        type:       a.type,
        subject:    a.subject,
        activityAt: a.activityAt,
        clientName: a.user?.displayName ?? null,
        saleTitle:  null,
        userName:   a.user?.displayName ?? null,
      }))

    const pendingTasks = [...store.tasks]
      .filter(t => t.status !== TaskStatus.DONE)
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.localeCompare(b.dueDate)
      })
      .slice(0, 6)
      .map(t => ({
        id:             t.id,
        subject:        t.subject,
        priority:       t.priority,
        dueDate:        t.dueDate ?? null,
        clientName:     t.client?.name ?? null,
        assignedToName: t.assignedTo?.displayName ?? null,
      }))

    return HttpResponse.json({
      thisMonth: {
        toCollectAmount: sumAmount(toCollectThis),
        collectedAmount: sumAmount(collectedThis),
        newSalesCount:   newSalesThis,
        newClientsCount: newClientsThis,
      },
      lastMonth: {
        toCollectAmount: sumAmount(toCollectLast),
        collectedAmount: sumAmount(collectedLast),
        newSalesCount:   newSalesLast,
        newClientsCount: newClientsLast,
      },
      delta: {
        toCollectAmount: deltaPercent(sumAmount(toCollectThis), sumAmount(toCollectLast)),
        collectedAmount: deltaPercent(sumAmount(collectedThis), sumAmount(collectedLast)),
        newSalesCount:   deltaPercent(newSalesThis, newSalesLast),
        newClientsCount: deltaPercent(newClientsThis, newClientsLast),
      },
      pipeline: { openCount, openValue, insuranceOpenCount, energyOpenCount },
      recentActivities,
      pendingTasks,
    })
  }),
]

// ── Cases ─────────────────────────────────────────────────────────────────────

const casesHandlers = [
  http.get(`${API}/cases`, () =>
    HttpResponse.json(
      [...store.cases].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    ),
  ),

  http.get(`${API}/cases/:id`, ({ params }) => {
    const found = store.cases.find(c => c.id === params.id)
    if (!found) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(found)
  }),

  http.post(`${API}/cases`, async ({ request }) => {
    const data = await request.json() as CaseInput
    const now = new Date().toISOString()
    const client = store.clients.find(c => c.id === data.clientId)
    const newCase: Case = {
      id:          `case-new-${Date.now()}`,
      clientId:    data.clientId,
      client:      { id: data.clientId, name: client?.name ?? '' },
      title:       data.title,
      description: data.description,
      status:      data.status ?? 'OPEN',
      createdAt:   now,
      updatedAt:   now,
    }
    store.cases.unshift(newCase)
    return HttpResponse.json(newCase, { status: 201 })
  }),

  http.put(`${API}/cases/:id`, async ({ params, request }) => {
    const idx = store.cases.findIndex(c => c.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const data = await request.json() as Partial<CaseInput>
    const updated: Case = {
      ...store.cases[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    store.cases[idx] = updated
    return HttpResponse.json(updated)
  }),

  http.delete(`${API}/cases/:id`, ({ params }) => {
    const idx = store.cases.findIndex(c => c.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    store.cases.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

// ── Export ────────────────────────────────────────────────────────────────────

export const handlers = [
  ...authHandlers,
  ...clientHandlers,
  ...salesHandlers,
  ...usersHandlers,
  ...collaboratorHandlers,
  ...tasksHandlers,
  ...documentsHandlers,
  ...activityHandlers,
  ...dashboardHandlers,
  ...casesHandlers,
]
