import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CaseForm from './CaseForm'
import type { Case } from '../../../api/cases'
import type { Client } from '../../../api/clients'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'cases.new':                    'Nuevo caso',
        'cases.edit':                   'Editar caso',
        'cases.sections.main':          'Datos del caso',
        'cases.sections.description':   'Descripción',
        'cases.fields.client':          'Cliente',
        'cases.fields.clientPlaceholder': '— Seleccionar cliente —',
        'cases.fields.clientLoading':   'Cargando clientes...',
        'cases.fields.title':           'Asunto',
        'cases.fields.description':     'Descripción',
        'cases.fields.status':          'Estado',
        'cases.actions.save':           'Guardar',
        'cases.actions.saving':         'Guardando...',
        'cases.actions.cancel':         'Cancelar',
        'cases.actions.delete':         'Eliminar caso',
        'cases.deleteConfirm':          '¿Eliminar este caso?',
        'cases.status.OPEN':            'Abierto',
        'cases.status.IN_PROGRESS':     'En curso',
        'cases.status.RESOLVED':        'Resuelto',
        'cases.status.CLOSED':          'Cerrado',
        'common.searchOptions':         'Buscar...',
        'common.noResults':             'Sin resultados',
      }
      return map[key] ?? key
    },
  }),
}))

vi.mock('../../../hooks/usePermissions', () => ({
  usePermissions: () => ({ canDelete: true }),
}))

const MOCK_CLIENTS: Client[] = [
  { id: 'c-1', name: 'Carmen López', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'c-2', name: 'Antonio García', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
]

vi.mock('../../../context/DataContext', () => ({
  useClients: () => ({ clients: MOCK_CLIENTS, loading: false }),
}))

vi.mock('../../../api/cases', () => ({
  createCase: vi.fn(),
  updateCase:  vi.fn(),
}))

import * as casesApi from '../../../api/cases'
const mockCreateCase = vi.mocked(casesApi.createCase)
const mockUpdateCase = vi.mocked(casesApi.updateCase)

vi.mock('../../shared/ConfirmModal/ConfirmModal', () => ({
  default: ({ title, actions }: { title: string; actions: { label: string; onClick: () => void; variant: string }[] }) => (
    <div data-testid="confirm-modal">
      <span>{title}</span>
      {actions.map((a) => (
        <button key={a.label} onClick={a.onClick}>{a.label}</button>
      ))}
    </div>
  ),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const EXISTING_CASE: Case = {
  id:          'case-001',
  clientId:    'c-1',
  client:      { id: 'c-1', name: 'Carmen López' },
  title:       'Siniestro agua',
  description: 'Rotura de tubería',
  status:      'IN_PROGRESS',
  createdAt:   '2024-01-10T00:00:00Z',
  updatedAt:   '2024-01-15T00:00:00Z',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CaseForm — new', () => {
  const onSave   = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the new case title', () => {
    render(<CaseForm case={null} onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('Nuevo caso')).toBeInTheDocument()
  })

  it('renders client selector, title input, status select and description', () => {
    render(<CaseForm case={null} onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText(/Cliente \*/)).toBeInTheDocument()
    expect(screen.getByText(/Asunto \*/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Estado/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Descripción/)).toBeInTheDocument()
  })

  it('submit button is disabled until client and title are filled', () => {
    render(<CaseForm case={null} onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    render(<CaseForm case={null} onSave={onSave} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('calls createCase and onSave on valid submit', async () => {
    const savedCase = { ...EXISTING_CASE, id: 'case-new' }
    mockCreateCase.mockResolvedValue(savedCase)

    render(<CaseForm case={null} onSave={onSave} onCancel={onCancel} />)

    // Open the client dropdown and pick the first client
    await userEvent.click(screen.getByRole('button', { name: /Seleccionar cliente/ }))
    await userEvent.click(screen.getByText('Carmen López'))

    // Fill in the title
    await userEvent.type(screen.getByLabelText(/Asunto \*/), 'Nuevo siniestro')

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(mockCreateCase).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: 'c-1', title: 'Nuevo siniestro' })
      )
      expect(onSave).toHaveBeenCalledWith(savedCase)
    })
  })
})

describe('CaseForm — edit', () => {
  const onSave   = vi.fn()
  const onCancel = vi.fn()
  const onDelete = vi.fn()

  beforeEach(() => vi.clearAllMocks())

  it('renders the edit case title', () => {
    render(<CaseForm case={EXISTING_CASE} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />)
    expect(screen.getByText('Editar caso')).toBeInTheDocument()
  })

  it('pre-fills title and description from the existing case', () => {
    render(<CaseForm case={EXISTING_CASE} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />)
    expect(screen.getByDisplayValue('Siniestro agua')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Rotura de tubería')).toBeInTheDocument()
  })

  it('shows the delete button for OWNER', () => {
    render(<CaseForm case={EXISTING_CASE} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />)
    expect(screen.getByRole('button', { name: /Eliminar caso/ })).toBeInTheDocument()
  })

  it('opens confirm modal when delete is clicked', async () => {
    render(<CaseForm case={EXISTING_CASE} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /Eliminar caso/ }))
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
  })

  it('calls onDelete when confirmed', async () => {
    render(<CaseForm case={EXISTING_CASE} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /Eliminar caso/ }))
    const modal = screen.getByTestId('confirm-modal')
    await userEvent.click(within(modal).getByRole('button', { name: 'Eliminar caso' }))
    expect(onDelete).toHaveBeenCalledWith('case-001')
  })

  it('calls updateCase and onSave on valid submit', async () => {
    const updated = { ...EXISTING_CASE, title: 'Título actualizado' }
    mockUpdateCase.mockResolvedValue(updated)

    render(<CaseForm case={EXISTING_CASE} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />)

    const titleInput = screen.getByDisplayValue('Siniestro agua')
    await userEvent.clear(titleInput)
    await userEvent.type(titleInput, 'Título actualizado')

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(mockUpdateCase).toHaveBeenCalledWith(
        'case-001',
        expect.objectContaining({ title: 'Título actualizado' })
      )
      expect(onSave).toHaveBeenCalledWith(updated)
    })
  })
})
