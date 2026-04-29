import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../i18n'
import CaseDetail from './CaseDetail'
import type { Case } from '../../../api/cases'
import * as activitiesApi from '../../../api/activities'
import * as tasksApi from '../../../api/tasks'

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-owner', role: 'OWNER', displayName: 'Mila' } }),
}))
vi.mock('../../../api/activities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/activities')>()
  return { ...actual, getActivities: vi.fn() }
})
vi.mock('../../../api/tasks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/tasks')>()
  return { ...actual, getTasks: vi.fn() }
})
vi.mock('../../../api/users',     () => ({ getUsers:     vi.fn().mockResolvedValue([]) }))
vi.mock('../../../api/clients',   () => ({ getClients:   vi.fn().mockResolvedValue([]), getClient: vi.fn() }))
vi.mock('../../../api/sales',     () => ({ getSales:     vi.fn().mockResolvedValue([]) }))
vi.mock('../../../api/cases',     () => ({ getCases:     vi.fn().mockResolvedValue([]) }))
vi.mock('../../../api/suppliers', () => ({ getSuppliers: vi.fn().mockResolvedValue([]) }))
vi.mock('../../../api/documents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/documents')>()
  return { ...actual, getDocuments: vi.fn().mockResolvedValue([]) }
})

const CASE: Case = {
  id:          'case-1',
  clientId:    'c-1',
  client:      { id: 'c-1', name: 'Carmen Ortega' },
  saleId:      's-1',
  sale:        { id: 's-1', title: 'Seguro Hogar' },
  name:        'Daños por agua en vivienda',
  occurrenceAt: '2026-03-10T09:00:00.000Z',
  description: 'Inundación en el baño',
  cause:       'Rotura de tubería',
  type:        'CLAIM',
  status:      'IN_PROGRESS',
  priority:    'HIGH',
  supplierId:  null,
  supplier:    null,
  createdAt:   '2026-03-10T09:00:00.000Z',
  updatedAt:   '2026-04-01T10:00:00.000Z',
}

function renderDetail(props?: { onViewClient?: () => void; onViewSale?: () => void }) {
  const onBack = vi.fn()
  const onEdit = vi.fn()
  return {
    onBack,
    onEdit,
    ...render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <CaseDetail
            case={CASE}
            onBack={onBack}
            onEdit={onEdit}
            onViewClient={props?.onViewClient}
            onViewSale={props?.onViewSale}
          />
        </I18nextProvider>
      </MemoryRouter>
    ),
  }
}

beforeEach(() => {
  vi.mocked(activitiesApi.getActivities).mockResolvedValue([])
  vi.mocked(tasksApi.getTasks).mockResolvedValue([])
  vi.clearAllMocks()
  vi.mocked(activitiesApi.getActivities).mockResolvedValue([])
  vi.mocked(tasksApi.getTasks).mockResolvedValue([])
})

describe('CaseDetail', () => {
  it('renders the case name in the header', () => {
    renderDetail()
    expect(screen.getByText('Daños por agua en vivienda')).toBeInTheDocument()
  })

  it('renders status and priority badges', () => {
    renderDetail()
    expect(screen.getByText(/en trámite|in progress/i)).toBeInTheDocument()
    expect(screen.getByText(/alta|high/i)).toBeInTheDocument()
  })

  it('renders the type badge', () => {
    renderDetail()
    expect(screen.getByText(/siniestro|claim/i)).toBeInTheDocument()
  })

  it('shows client name and sale title in header meta', () => {
    renderDetail()
    // Client name appears in both header meta and info card — check at least once
    expect(screen.getAllByText('Carmen Ortega').length).toBeGreaterThan(0)
    expect(screen.getByText('Seguro Hogar')).toBeInTheDocument()
  })

  it('calls onBack when back button is clicked', () => {
    const { onBack } = renderDetail()
    fireEvent.click(screen.getByTitle(/volver|back/i))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('calls onEdit with the case when edit button is clicked', () => {
    const { onEdit } = renderDetail()
    fireEvent.click(screen.getByText(/editar|edit/i))
    expect(onEdit).toHaveBeenCalledWith(CASE)
  })

  it('shows description and cause in the info card', () => {
    renderDetail()
    expect(screen.getByText('Inundación en el baño')).toBeInTheDocument()
    expect(screen.getByText('Rotura de tubería')).toBeInTheDocument()
  })

  it('shows "View client" button when onViewClient is provided', () => {
    const onViewClient = vi.fn()
    renderDetail({ onViewClient })
    const btn = screen.getByText(/ver ficha cliente|view client/i)
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(onViewClient).toHaveBeenCalledWith('c-1')
  })

  it('does not show "View client" button when onViewClient is not provided', () => {
    renderDetail()
    expect(screen.queryByText(/ver ficha cliente|view client/i)).not.toBeInTheDocument()
  })

  it('shows Activity tab active by default and loads activities by caseId', async () => {
    renderDetail()
    await waitFor(() =>
      expect(vi.mocked(activitiesApi.getActivities)).toHaveBeenCalledWith({ caseId: 'case-1' })
    )
  })

  it('switches to Tasks tab and loads tasks by caseId', async () => {
    renderDetail()
    fireEvent.click(screen.getByText(/tareas|tasks/i))
    await waitFor(() =>
      expect(vi.mocked(tasksApi.getTasks)).toHaveBeenCalledWith({ caseId: 'case-1' })
    )
  })

  it('shows Documents tab button', () => {
    renderDetail()
    expect(screen.getByText(/documentos|documents/i)).toBeInTheDocument()
  })
})
