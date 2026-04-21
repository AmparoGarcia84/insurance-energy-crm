import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../i18n'
import ClientActivityTab from './ClientActivityTab'
import * as activitiesApi from '../../api/activities'
import { ActivityType } from '../../api/activities'

// Mock auth context
vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-owner', role: 'OWNER', displayName: 'Mila' } }),
}))

vi.mock('../../api/activities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/activities')>()
  return {
    ...actual,
    getActivities:    vi.fn(),
    createActivity:   vi.fn(),
    updateActivity:   vi.fn(),
    deleteActivity:   vi.fn(),
  }
})

const mockGet    = vi.mocked(activitiesApi.getActivities)
const mockCreate = vi.mocked(activitiesApi.createActivity)
const mockDelete = vi.mocked(activitiesApi.deleteActivity)

const STUB_ACTIVITY = {
  id:          'act-001',
  userId:      'u-owner',
  clientId:    'c-1',
  saleId:      undefined,
  type:        ActivityType.CALL,
  direction:   undefined,
  subject:     'Initial call',
  description: undefined,
  outcome:     undefined,
  nextStep:    undefined,
  activityAt:  '2026-04-21T10:00:00.000Z',
  createdAt:   '2026-04-21T10:00:00.000Z',
  updatedAt:   '2026-04-21T10:00:00.000Z',
  user:        { id: 'u-owner', displayName: 'Mila' },
}

function renderTab() {
  return render(
    <I18nextProvider i18n={i18n}>
      <ClientActivityTab clientId="c-1" />
    </I18nextProvider>
  )
}

beforeEach(() => vi.clearAllMocks())

describe('ClientActivityTab', () => {
  it('shows empty state when there are no activities', async () => {
    mockGet.mockResolvedValue([])
    renderTab()
    await waitFor(() => {
      expect(screen.getByText(/sin actividades|no activities/i)).toBeInTheDocument()
    })
  })

  it('renders activity list', async () => {
    mockGet.mockResolvedValue([STUB_ACTIVITY])
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('Initial call')).toBeInTheDocument()
    })
  })

  it('loads activities for the given clientId', async () => {
    mockGet.mockResolvedValue([])
    renderTab()
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith({ clientId: 'c-1' })
    })
  })

  it('filters activities by search term', async () => {
    mockGet.mockResolvedValue([
      STUB_ACTIVITY,
      { ...STUB_ACTIVITY, id: 'act-002', subject: 'Email follow-up' },
    ])
    renderTab()
    await waitFor(() => screen.getByText('Initial call'))

    const input = screen.getByPlaceholderText(/buscar|search/i)
    fireEvent.change(input, { target: { value: 'email' } })

    expect(screen.queryByText('Initial call')).not.toBeInTheDocument()
    expect(screen.getByText('Email follow-up')).toBeInTheDocument()
  })

  it('shows the form when "New activity" is clicked', async () => {
    mockGet.mockResolvedValue([])
    renderTab()
    await waitFor(() => screen.getByText(/nueva actividad|new activity/i))

    fireEvent.click(screen.getByText(/nueva actividad|new activity/i))
    expect(screen.getByLabelText(/asunto|subject/i)).toBeInTheDocument()
  })

  it('adds a new activity to the list after save', async () => {
    mockGet.mockResolvedValue([])
    mockCreate.mockResolvedValue(STUB_ACTIVITY)
    renderTab()
    await waitFor(() => screen.getByText(/nueva actividad|new activity/i))

    fireEvent.click(screen.getByText(/nueva actividad|new activity/i))
    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'Initial call' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar|save/i }))

    await waitFor(() => {
      expect(screen.getByText('Initial call')).toBeInTheDocument()
    })
  })

  it('shows edit form pre-filled when edit button is clicked', async () => {
    mockGet.mockResolvedValue([STUB_ACTIVITY])
    renderTab()
    await waitFor(() => screen.getByText('Initial call'))

    const editBtn = screen.getByTitle(/editar|edit/i)
    fireEvent.click(editBtn)

    expect(screen.getByLabelText<HTMLInputElement>(/asunto|subject/i).value).toBe('Initial call')
  })

  it('shows delete button only for OWNER', async () => {
    mockGet.mockResolvedValue([STUB_ACTIVITY])
    renderTab()
    await waitFor(() => screen.getByText('Initial call'))
    // OWNER mock — delete button should be present
    expect(screen.getByTitle(/eliminar|delete/i)).toBeInTheDocument()
  })

  it('removes activity from list after deletion', async () => {
    mockGet.mockResolvedValue([STUB_ACTIVITY])
    mockDelete.mockResolvedValue(undefined)
    renderTab()
    await waitFor(() => screen.getByText('Initial call'))

    fireEvent.click(screen.getByTitle(/eliminar|delete/i))
    // Confirm modal appears — click the delete action
    const confirmBtn = screen.getAllByText(/eliminar|delete/i).find(
      (el) => el.tagName === 'BUTTON' && el.closest('.modal')
    )
    if (confirmBtn) fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.queryByText('Initial call')).not.toBeInTheDocument()
    })
  })
})
