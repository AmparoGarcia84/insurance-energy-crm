import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../i18n'
import ActivityTab from './ActivityTab'
import * as activitiesApi from '../../../api/activities'
import { ActivityType } from '../../../api/activities'

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-owner', role: 'OWNER', displayName: 'Mila' } }),
}))

vi.mock('../../../api/activities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/activities')>()
  return {
    ...actual,
    getActivities:  vi.fn(),
    createActivity: vi.fn(),
    updateActivity: vi.fn(),
    deleteActivity: vi.fn(),
  }
})

const mockGet    = vi.mocked(activitiesApi.getActivities)
const mockCreate = vi.mocked(activitiesApi.createActivity)
const mockDelete = vi.mocked(activitiesApi.deleteActivity)

const BASE = {
  id:          'act-001',
  userId:      'u-owner',
  clientId:    'c-1',
  type:        ActivityType.CALL,
  direction:   undefined,
  subject:     'First contact',
  description: undefined,
  outcome:     undefined,
  nextStep:    undefined,
  activityAt:  '2026-04-21T10:00:00.000Z',
  createdAt:   '2026-04-21T10:00:00.000Z',
  updatedAt:   '2026-04-21T10:00:00.000Z',
  user:        { id: 'u-owner', displayName: 'Mila' },
}

beforeEach(() => vi.clearAllMocks())

// ── Client context ────────────────────────────────────────────────────────────

describe('ActivityTab — client context', () => {
  function renderTab() {
    return render(
      <I18nextProvider i18n={i18n}>
        <ActivityTab clientId="c-1" />
      </I18nextProvider>
    )
  }

  it('loads activities by clientId', async () => {
    mockGet.mockResolvedValue([])
    renderTab()
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith({ clientId: 'c-1' }))
  })

  it('shows empty state', async () => {
    mockGet.mockResolvedValue([])
    renderTab()
    await waitFor(() =>
      expect(screen.getByText(/sin actividades|no activities/i)).toBeInTheDocument()
    )
  })

  it('renders activity list', async () => {
    mockGet.mockResolvedValue([BASE])
    renderTab()
    await waitFor(() => expect(screen.getByText('First contact')).toBeInTheDocument())
  })

  it('does not inject saleId or caseId into create payload', async () => {
    mockGet.mockResolvedValue([])
    mockCreate.mockResolvedValue(BASE)
    renderTab()
    await waitFor(() => screen.getByText(/nueva actividad|new activity/i))
    fireEvent.click(screen.getByText(/nueva actividad|new activity/i))
    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'First contact' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar|save/i }))
    await waitFor(() => {
      const payload = mockCreate.mock.calls[0]?.[0]
      expect(payload).not.toHaveProperty('saleId')
      expect(payload).not.toHaveProperty('caseId')
    })
  })
})

// ── Sale context ──────────────────────────────────────────────────────────────

describe('ActivityTab — sale context', () => {
  const STUB = { ...BASE, saleId: 's-1' }

  function renderTab(opts?: { openFormOnMount?: boolean }) {
    return render(
      <I18nextProvider i18n={i18n}>
        <ActivityTab clientId="c-1" saleId="s-1" {...opts} />
      </I18nextProvider>
    )
  }

  it('loads activities by saleId (not clientId)', async () => {
    mockGet.mockResolvedValue([])
    renderTab()
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith({ saleId: 's-1' }))
  })

  it('injects saleId into create payload', async () => {
    mockGet.mockResolvedValue([])
    mockCreate.mockResolvedValue(STUB)
    renderTab()
    await waitFor(() => screen.getByText(/nueva actividad|new activity/i))
    fireEvent.click(screen.getByText(/nueva actividad|new activity/i))
    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'First contact' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar|save/i }))
    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ saleId: 's-1', clientId: 'c-1' }))
    )
  })

  it('opens form on mount when openFormOnMount=true', async () => {
    mockGet.mockResolvedValue([])
    renderTab({ openFormOnMount: true })
    await waitFor(() =>
      expect(screen.getByLabelText(/asunto|subject/i)).toBeInTheDocument()
    )
  })
})

// ── Case context ──────────────────────────────────────────────────────────────

describe('ActivityTab — case context', () => {
  const STUB = { ...BASE, caseId: 'case-1' }

  function renderTab() {
    return render(
      <I18nextProvider i18n={i18n}>
        <ActivityTab clientId="c-1" caseId="case-1" />
      </I18nextProvider>
    )
  }

  it('loads activities by caseId (most specific filter)', async () => {
    mockGet.mockResolvedValue([])
    renderTab()
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith({ caseId: 'case-1' }))
  })

  it('injects caseId into create payload', async () => {
    mockGet.mockResolvedValue([])
    mockCreate.mockResolvedValue(STUB)
    renderTab()
    await waitFor(() => screen.getByText(/nueva actividad|new activity/i))
    fireEvent.click(screen.getByText(/nueva actividad|new activity/i))
    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'First contact' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar|save/i }))
    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ caseId: 'case-1' }))
    )
  })
})

// ── Shared behaviour ──────────────────────────────────────────────────────────

describe('ActivityTab — shared behaviour', () => {
  function renderTab() {
    return render(
      <I18nextProvider i18n={i18n}>
        <ActivityTab clientId="c-1" />
      </I18nextProvider>
    )
  }

  it('filters list by search term', async () => {
    mockGet.mockResolvedValue([
      BASE,
      { ...BASE, id: 'act-002', subject: 'Email follow-up' },
    ])
    renderTab()
    await waitFor(() => screen.getByText('First contact'))
    fireEvent.change(screen.getByPlaceholderText(/buscar|search/i), { target: { value: 'email' } })
    expect(screen.queryByText('First contact')).not.toBeInTheDocument()
    expect(screen.getByText('Email follow-up')).toBeInTheDocument()
  })

  it('shows edit form pre-filled', async () => {
    mockGet.mockResolvedValue([BASE])
    renderTab()
    await waitFor(() => screen.getByText('First contact'))
    fireEvent.click(screen.getByTitle(/editar|edit/i))
    expect(screen.getByLabelText<HTMLInputElement>(/asunto|subject/i).value).toBe('First contact')
  })

  it('removes activity after deletion', async () => {
    mockGet.mockResolvedValue([BASE])
    mockDelete.mockResolvedValue(undefined)
    renderTab()
    await waitFor(() => screen.getByText('First contact'))
    fireEvent.click(screen.getByTitle(/eliminar|delete/i))
    const confirmBtn = screen.getAllByText(/eliminar|delete/i).find(
      (el) => el.tagName === 'BUTTON' && el.closest('.modal'),
    )
    if (confirmBtn) fireEvent.click(confirmBtn)
    await waitFor(() =>
      expect(screen.queryByText('First contact')).not.toBeInTheDocument()
    )
  })
})
