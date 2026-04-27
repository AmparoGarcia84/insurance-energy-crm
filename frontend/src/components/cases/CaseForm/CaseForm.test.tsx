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
        'cases.new':                       'Nuevo caso',
        'cases.edit':                      'Editar caso',
        'cases.sections.main':             'Datos del caso',
        'cases.sections.description':      'Descripción y causa',
        'cases.fields.client':             'Cliente asociado',
        'cases.fields.clientPlaceholder':  '— Seleccionar cliente —',
        'cases.fields.clientLoading':      'Cargando clientes...',
        'cases.fields.sale':               'Venta asociada',
        'cases.fields.salePlaceholder':    '— Seleccionar venta —',
        'cases.fields.saleNone':           'Sin venta asociada',
        'cases.fields.name':               'Nombre del caso',
        'cases.fields.occurrenceAt':       'Fecha y hora de ocurrencia',
        'cases.fields.description':        'Descripción',
        'cases.fields.cause':              'Causa',
        'cases.fields.type':               'Tipo',
        'cases.fields.typePlaceholder':    '— Seleccionar tipo —',
        'cases.fields.status':             'Fase',
        'cases.fields.priority':           'Prioridad',
        'cases.fields.supplier':           'Proveedor asignado',
        'cases.fields.supplierPlaceholder': '— Seleccionar proveedor —',
        'cases.fields.supplierLoading':    'Cargando proveedores...',
        'cases.status.NEW':         'Nuevo',
        'cases.status.ON_HOLD':     'En espera',
        'cases.status.FORWARDED':   'Derivado',
        'cases.status.IN_PROGRESS': 'En trámite',
        'cases.status.CLOSED':      'Cerrado',
        'cases.priority.HIGH':   'Alta',
        'cases.priority.NORMAL': 'Normal',
        'cases.priority.LOW':    'Baja',
        'cases.type.CLAIM':            'Siniestro',
        'cases.type.FAULT':            'Avería',
        'cases.type.ACTIVATION':       'Activación',
        'cases.type.WRONG_SETTLEMENT': 'Liquidación errónea',
        'cases.actions.save':   'Guardar',
        'cases.actions.saving': 'Guardando...',
        'cases.actions.cancel': 'Cancelar',
        'cases.actions.delete': 'Eliminar caso',
        'cases.deleteConfirm':  '¿Eliminar este caso?',
        'common.searchOptions': 'Buscar...',
        'common.noResults':     'Sin resultados',
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

const MOCK_SALES = [
  { id: 's-1', clientId: 'c-1', title: 'Seguro de hogar', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 's-2', clientId: 'c-2', title: 'Seguro de coche', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
]

vi.mock('../../../context/DataContext', () => ({
  useClients: () => ({ clients: MOCK_CLIENTS, loading: false }),
  useSales:   () => ({ sales: MOCK_SALES }),
}))

vi.mock('../../../api/suppliers', () => ({
  getSuppliers: vi.fn().mockResolvedValue([
    { id: 'sup-1', name: 'Mapfre', cif: 'A28006208', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  ]),
}))

vi.mock('../../../api/cases', () => ({
  createCase: vi.fn(),
  updateCase: vi.fn(),
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
  id:           'case-001',
  clientId:     'c-1',
  client:       { id: 'c-1', name: 'Carmen López' },
  saleId:       's-1',
  sale:         { id: 's-1', title: 'Seguro de hogar' },
  name:         'Siniestro agua',
  occurrenceAt: '2024-03-10T09:30:00.000Z',
  description:  'Rotura de tubería',
  cause:        'Envejecimiento',
  type:         'CLAIM',
  status:       'IN_PROGRESS',
  priority:     'NORMAL',
  supplierId:   null,
  supplier:     null,
  createdAt:    '2024-01-10T00:00:00Z',
  updatedAt:    '2024-01-15T00:00:00Z',
}

// ── Tests — new form ──────────────────────────────────────────────────────────

describe('CaseForm — new', () => {
  const onSave   = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => vi.clearAllMocks())

  it('renders the new case title', () => {
    render(<CaseForm case={null} onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('Nuevo caso')).toBeInTheDocument()
  })

  it('renders all main fields', () => {
    render(<CaseForm case={null} onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText(/Cliente asociado/)).toBeInTheDocument()
    expect(screen.getByText(/Nombre del caso/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Fecha y hora de ocurrencia/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Tipo/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Fase/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Prioridad/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Descripción/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Causa/)).toBeInTheDocument()
  })

  it('submit is disabled until client and name are filled', () => {
    render(<CaseForm case={null} onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })

  it('calls onCancel when cancel is clicked', async () => {
    render(<CaseForm case={null} onSave={onSave} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows supplier field only when type is WRONG_SETTLEMENT', async () => {
    render(<CaseForm case={null} onSave={onSave} onCancel={onCancel} />)
    expect(screen.queryByText(/Proveedor asignado/)).not.toBeInTheDocument()

    const typeSelect = screen.getByLabelText(/Tipo/)
    await userEvent.selectOptions(typeSelect, 'WRONG_SETTLEMENT')

    expect(screen.getByText(/Proveedor asignado/)).toBeInTheDocument()
  })

  it('hides supplier field when type changes away from WRONG_SETTLEMENT', async () => {
    render(<CaseForm case={null} onSave={onSave} onCancel={onCancel} />)
    const typeSelect = screen.getByLabelText(/Tipo/)
    await userEvent.selectOptions(typeSelect, 'WRONG_SETTLEMENT')
    expect(screen.getByText(/Proveedor asignado/)).toBeInTheDocument()

    await userEvent.selectOptions(typeSelect, 'CLAIM')
    expect(screen.queryByText(/Proveedor asignado/)).not.toBeInTheDocument()
  })

  it('calls createCase with correct payload and calls onSave', async () => {
    const savedCase = { ...EXISTING_CASE, id: 'case-new' }
    mockCreateCase.mockResolvedValue(savedCase)

    render(<CaseForm case={null} onSave={onSave} onCancel={onCancel} />)

    await userEvent.click(screen.getByRole('button', { name: /Seleccionar cliente/ }))
    await userEvent.click(screen.getByText('Carmen López'))

    await userEvent.type(screen.getByLabelText(/Nombre del caso \*/), 'Nuevo siniestro')

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(mockCreateCase).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: 'c-1', name: 'Nuevo siniestro' })
      )
      expect(onSave).toHaveBeenCalledWith(savedCase)
    })
  })

  it('pre-fills client when initialClientId is provided', () => {
    render(
      <CaseForm case={null} onSave={onSave} onCancel={onCancel} initialClientId="c-1" />
    )
    // The searchable select should show the button text with the client name
    expect(screen.getByRole('button', { name: /Carmen López/ })).toBeInTheDocument()
  })
})

// ── Tests — edit form ─────────────────────────────────────────────────────────

describe('CaseForm — edit', () => {
  const onSave   = vi.fn()
  const onCancel = vi.fn()
  const onDelete = vi.fn()

  beforeEach(() => vi.clearAllMocks())

  it('renders the edit case title', () => {
    render(<CaseForm case={EXISTING_CASE} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />)
    expect(screen.getByText('Editar caso')).toBeInTheDocument()
  })

  it('pre-fills name, description and cause', () => {
    render(<CaseForm case={EXISTING_CASE} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />)
    expect(screen.getByDisplayValue('Siniestro agua')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Rotura de tubería')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Envejecimiento')).toBeInTheDocument()
  })

  it('pre-fills status and priority selects', () => {
    render(<CaseForm case={EXISTING_CASE} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />)
    expect(screen.getByDisplayValue('En trámite')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Normal')).toBeInTheDocument()
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
    const updated = { ...EXISTING_CASE, name: 'Nombre actualizado' }
    mockUpdateCase.mockResolvedValue(updated)

    render(<CaseForm case={EXISTING_CASE} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />)

    const nameInput = screen.getByDisplayValue('Siniestro agua')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Nombre actualizado')

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(mockUpdateCase).toHaveBeenCalledWith(
        'case-001',
        expect.objectContaining({ name: 'Nombre actualizado' })
      )
      expect(onSave).toHaveBeenCalledWith(updated)
    })
  })
})
