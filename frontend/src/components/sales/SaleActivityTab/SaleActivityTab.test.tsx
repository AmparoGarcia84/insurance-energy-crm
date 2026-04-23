import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../i18n'
import SaleActivityTab from './SaleActivityTab'
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

const STUB_ACTIVITY = {
  id:          'act-001',
  userId:      'u-owner',
  clientId:    'c-1',
  saleId:      's-1',
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

function renderTab(props?: { openFormOnMount?: boolean }) {
  return render(
    <I18nextProvider i18n={i18n}>
      <SaleActivityTab saleId="s-1" clientId="c-1" {...props} />
    </I18nextProvider>
  )
}

beforeEach(() => vi.clearAllMocks())

describe('SaleActivityTab', () => {
  it('shows empty state when there are no activities', async () => {
    mockGet.mockResolvedValue([])
    renderTab()
    await waitFor(() => {
      expect(screen.getByText(/sin actividades|no activities/i)).toBeInTheDocument()
    })
  })

  it('loads activities filtered by saleId', async () => {
    mockGet.mockResolvedValue([])
    renderTab()
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith({ saleId: 's-1' })
    })
  })

  it('renders activity list', async () => {
    mockGet.mockResolvedValue([STUB_ACTIVITY])
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('First contact')).toBeInTheDocument()
    })
  })

  it('filters activities by search term', async () => {
    mockGet.mockResolvedValue([
      STUB_ACTIVITY,
      { ...STUB_ACTIVITY, id: 'act-002', subject: 'Email follow-up' },
    ])
    renderTab()
    await waitFor(() => screen.getByText('First contact'))

    const input = screen.getByPlaceholderText(/buscar|search/i)
    fireEvent.change(input, { target: { value: 'email' } })

    expect(screen.queryByText('First contact')).not.toBeInTheDocument()
    expect(screen.getByText('Email follow-up')).toBeInTheDocument()
  })

  it('shows form when "New activity" is clicked', async () => {
    mockGet.mockResolvedValue([])
    renderTab()
    await waitFor(() => screen.getByText(/nueva actividad|new activity/i))

    fireEvent.click(screen.getByText(/nueva actividad|new activity/i))
    expect(screen.getByLabelText(/asunto|subject/i)).toBeInTheDocument()
  })

  it('opens form on mount when openFormOnMount is true', async () => {
    mockGet.mockResolvedValue([])
    renderTab({ openFormOnMount: true })
    await waitFor(() => {
      expect(screen.getByLabelText(/asunto|subject/i)).toBeInTheDocument()
    })
  })

  it('injects saleId into payload on create', async () => {
    mockGet.mockResolvedValue([])
    mockCreate.mockResolvedValue(STUB_ACTIVITY)
    renderTab()
    await waitFor(() => screen.getByText(/nueva actividad|new activity/i))

    fireEvent.click(screen.getByText(/nueva actividad|new activity/i))
    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'First contact' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar|save/i }))

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ saleId: 's-1', clientId: 'c-1' })
      )
    })
  })

  it('removes activity from list after deletion', async () => {
    mockGet.mockResolvedValue([STUB_ACTIVITY])
    mockDelete.mockResolvedValue(undefined)
    renderTab()
    await waitFor(() => screen.getByText('First contact'))

    fireEvent.click(screen.getByTitle(/eliminar|delete/i))
    const confirmBtn = screen.getAllByText(/eliminar|delete/i).find(
      (el) => el.tagName === 'BUTTON' && el.closest('.modal')
    )
    if (confirmBtn) fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.queryByText('First contact')).not.toBeInTheDocument()
    })
  })
})
