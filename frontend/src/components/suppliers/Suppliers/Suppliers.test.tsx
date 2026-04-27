import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Suppliers from './Suppliers'
import type { Supplier } from '../../../api/suppliers'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, unknown>) =>
    opts ? `${key}:${JSON.stringify(opts)}` : key
  }),
}))

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'OWNER' } }),
}))

const mockGetSuppliers  = vi.fn()
const mockGetSupplier   = vi.fn()
const mockDeleteSupplier = vi.fn()

vi.mock('../../../api/suppliers', () => ({
  getSuppliers:   (...args: unknown[]) => mockGetSuppliers(...args),
  getSupplier:    (...args: unknown[]) => mockGetSupplier(...args),
  createSupplier: vi.fn(),
  updateSupplier: vi.fn(),
  deleteSupplier: (...args: unknown[]) => mockDeleteSupplier(...args),
}))

// Lightweight stand-in components
vi.mock('../SuppliersList/SuppliersList', () => ({
  default: ({ suppliers, loading, onNew, onView, onEdit, onDelete }: {
    suppliers: Supplier[]
    loading: boolean
    onNew: () => void
    onView: (s: Supplier) => void
    onEdit: (s: Supplier) => void
    onDelete: (s: Supplier) => void
  }) => (
    <div data-testid="suppliers-list">
      {loading && <span>loading</span>}
      {suppliers.map((s) => (
        <div key={s.id}>
          <span>{s.name}</span>
          <button onClick={() => onView(s)}>view-{s.id}</button>
          <button onClick={() => onEdit(s)}>edit-{s.id}</button>
          <button onClick={() => onDelete(s)}>delete-{s.id}</button>
        </div>
      ))}
      <button onClick={onNew}>new</button>
    </div>
  ),
}))

vi.mock('../SupplierDetail/SupplierDetail', () => ({
  default: ({ supplier, onBack, onEdit }: {
    supplier: Supplier
    onBack: () => void
    onEdit: (s: Supplier) => void
  }) => (
    <div data-testid="supplier-detail">
      <span>{supplier.name}</span>
      <button onClick={onBack}>back</button>
      <button onClick={() => onEdit(supplier)}>edit-from-detail</button>
    </div>
  ),
}))

vi.mock('../SupplierForm/SupplierForm', () => ({
  default: ({ supplier, onSave, onCancel }: {
    supplier: Supplier | null
    onSave: (s: Supplier) => void
    onCancel: () => void
  }) => (
    <div data-testid="supplier-form">
      <span>{supplier ? `editing:${supplier.id}` : 'new'}</span>
      <button onClick={() => onSave({ ...mockSuppliers[0], name: 'Updated' })}>save</button>
      <button onClick={onCancel}>cancel</button>
    </div>
  ),
}))

vi.mock('../../shared/ConfirmModal/ConfirmModal', () => ({
  default: ({ onClose, actions }: {
    onClose: () => void
    actions: Array<{ label: string; onClick: () => void }>
  }) => (
    <div data-testid="confirm-modal">
      <button onClick={onClose}>close-modal</button>
      {actions.map((a) => (
        <button key={a.label} onClick={a.onClick}>{a.label}</button>
      ))}
    </div>
  ),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockSuppliers: Supplier[] = [
  {
    id: 's-001', name: 'Mapfre España S.A.', cif: 'A11111110',
    phone: '91 581 91 00',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    addresses: [], emails: [],
  },
  {
    id: 's-002', name: 'Endesa Energía S.A.U.', cif: 'B22222220',
    phone: '900 760 760',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    addresses: [], emails: [],
  },
]

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Suppliers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSuppliers.mockResolvedValue(mockSuppliers)
  })

  it('renders SuppliersList after loading', async () => {
    render(<Suppliers />)
    await waitFor(() => expect(screen.getByText('Mapfre España S.A.')).toBeInTheDocument())
    expect(screen.getByText('Endesa Energía S.A.U.')).toBeInTheDocument()
  })

  it('shows SupplierDetail when a supplier is viewed', async () => {
    render(<Suppliers />)
    await waitFor(() => screen.getByText('view-s-001'))
    fireEvent.click(screen.getByText('view-s-001'))
    expect(screen.getByTestId('supplier-detail')).toBeInTheDocument()
    expect(screen.getByText('Mapfre España S.A.')).toBeInTheDocument()
  })

  it('returns to list when back is clicked in SupplierDetail', async () => {
    render(<Suppliers />)
    await waitFor(() => screen.getByText('view-s-001'))
    fireEvent.click(screen.getByText('view-s-001'))
    fireEvent.click(screen.getByText('back'))
    expect(screen.getByTestId('suppliers-list')).toBeInTheDocument()
  })

  it('shows SupplierForm for a new supplier when new is clicked', async () => {
    render(<Suppliers />)
    await waitFor(() => screen.getByText('new'))
    fireEvent.click(screen.getByText('new'))
    expect(screen.getByTestId('supplier-form')).toBeInTheDocument()
    expect(screen.getByText('new')).toBeInTheDocument()
  })

  it('shows SupplierForm with existing supplier when edit is clicked', async () => {
    render(<Suppliers />)
    await waitFor(() => screen.getByText('edit-s-001'))
    fireEvent.click(screen.getByText('edit-s-001'))
    expect(screen.getByTestId('supplier-form')).toBeInTheDocument()
    expect(screen.getByText('editing:s-001')).toBeInTheDocument()
  })

  it('returns to list when cancel is clicked in SupplierForm', async () => {
    render(<Suppliers />)
    await waitFor(() => screen.getByText('new'))
    fireEvent.click(screen.getByText('new'))
    fireEvent.click(screen.getByText('cancel'))
    expect(screen.getByTestId('suppliers-list')).toBeInTheDocument()
  })

  it('updates the list and closes form when a supplier is saved', async () => {
    render(<Suppliers />)
    await waitFor(() => screen.getByText('new'))
    fireEvent.click(screen.getByText('new'))
    fireEvent.click(screen.getByText('save'))
    expect(screen.getByTestId('suppliers-list')).toBeInTheDocument()
    expect(screen.getByText('Updated')).toBeInTheDocument()
  })

  it('shows ConfirmModal when delete is triggered', async () => {
    render(<Suppliers />)
    await waitFor(() => screen.getByText('delete-s-001'))
    fireEvent.click(screen.getByText('delete-s-001'))
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
  })

  it('removes deleted supplier from list after confirm', async () => {
    mockDeleteSupplier.mockResolvedValue(undefined)

    render(<Suppliers />)
    await waitFor(() => screen.getByText('delete-s-001'))
    fireEvent.click(screen.getByText('delete-s-001'))

    // Click the delete action in the modal
    const deleteBtn = screen.getByText('suppliers.actions.delete')
    fireEvent.click(deleteBtn)

    await waitFor(() => {
      expect(screen.queryByText('Mapfre España S.A.')).not.toBeInTheDocument()
    })
    expect(mockDeleteSupplier).toHaveBeenCalledWith('s-001')
  })

  it('closes ConfirmModal without deleting when cancel is clicked', async () => {
    render(<Suppliers />)
    await waitFor(() => screen.getByText('delete-s-001'))
    fireEvent.click(screen.getByText('delete-s-001'))

    fireEvent.click(screen.getByText('suppliers.actions.cancel'))
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument()
    expect(mockDeleteSupplier).not.toHaveBeenCalled()
    expect(screen.getByText('Mapfre España S.A.')).toBeInTheDocument()
  })

  it('opens SupplierForm via edit from SupplierDetail', async () => {
    mockGetSupplier.mockResolvedValue(mockSuppliers[0])

    render(<Suppliers />)
    await waitFor(() => screen.getByText('view-s-001'))
    fireEvent.click(screen.getByText('view-s-001'))
    fireEvent.click(screen.getByText('edit-from-detail'))

    await waitFor(() => {
      expect(screen.getByTestId('supplier-form')).toBeInTheDocument()
      expect(screen.getByText('editing:s-001')).toBeInTheDocument()
    })
  })
})
