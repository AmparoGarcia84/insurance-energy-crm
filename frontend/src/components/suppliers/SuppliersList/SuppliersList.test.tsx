import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SuppliersList from './SuppliersList'
import type { Supplier } from '../../../api/suppliers'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

let mockRole = 'OWNER'

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { role: mockRole } }),
}))

const SUPPLIERS: Supplier[] = [
  {
    id: 's-001', name: 'Mapfre España S.A.', cif: 'A11111110',
    phone: '91 581 91 00', secondaryPhone: null,
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    addresses: [], emails: [{ id: 'e-1', address: 'info@mapfre.com', isPrimary: true }],
  },
  {
    id: 's-002', name: 'Endesa Energía S.A.U.', cif: 'B22222220',
    phone: '900 760 760',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    addresses: [], emails: [],
  },
]

describe('SuppliersList', () => {
  const onNew    = vi.fn()
  const onView   = vi.fn()
  const onEdit   = vi.fn()
  const onDelete = vi.fn()

  const defaultProps = { suppliers: SUPPLIERS, loading: false, onNew, onView, onEdit, onDelete }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRole = 'OWNER'
  })

  it('renders supplier rows', () => {
    render(<SuppliersList {...defaultProps} />)
    expect(screen.getByText('Mapfre España S.A.')).toBeInTheDocument()
    expect(screen.getByText('Endesa Energía S.A.U.')).toBeInTheDocument()
  })

  it('shows empty state when no suppliers', () => {
    render(<SuppliersList {...defaultProps} suppliers={[]} />)
    expect(screen.getByText('suppliers.empty')).toBeInTheDocument()
  })

  it('shows loading state (no table)', () => {
    render(<SuppliersList {...defaultProps} loading={true} />)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('filters by name', () => {
    render(<SuppliersList {...defaultProps} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'mapfre' } })
    expect(screen.getByText('Mapfre España S.A.')).toBeInTheDocument()
    expect(screen.queryByText('Endesa Energía S.A.U.')).not.toBeInTheDocument()
  })

  it('filters by CIF', () => {
    render(<SuppliersList {...defaultProps} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'B22222220' } })
    expect(screen.getByText('Endesa Energía S.A.U.')).toBeInTheDocument()
    expect(screen.queryByText('Mapfre España S.A.')).not.toBeInTheDocument()
  })

  it('shows empty search state when no match', () => {
    render(<SuppliersList {...defaultProps} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'xyz' } })
    expect(screen.getByText('suppliers.emptySearch')).toBeInTheDocument()
  })

  it('calls onNew when "New" button clicked', () => {
    render(<SuppliersList {...defaultProps} />)
    fireEvent.click(screen.getByText('suppliers.new'))
    expect(onNew).toHaveBeenCalledOnce()
  })

  it('calls onView when a row is clicked', () => {
    render(<SuppliersList {...defaultProps} />)
    fireEvent.click(screen.getByText('Mapfre España S.A.'))
    expect(onView).toHaveBeenCalledWith(SUPPLIERS[0])
  })

  it('calls onEdit when edit button clicked (no row navigation)', () => {
    render(<SuppliersList {...defaultProps} />)
    const editBtns = screen.getAllByTitle('suppliers.edit')
    fireEvent.click(editBtns[0])
    expect(onEdit).toHaveBeenCalledWith(SUPPLIERS[0])
    expect(onView).not.toHaveBeenCalled()
  })

  it('calls onDelete when delete button clicked for OWNER', () => {
    render(<SuppliersList {...defaultProps} />)
    const deleteBtns = screen.getAllByTitle('suppliers.actions.delete')
    fireEvent.click(deleteBtns[0])
    expect(onDelete).toHaveBeenCalledWith(SUPPLIERS[0])
  })

  it('shows fiscal street in address column', () => {
    const suppliers: Supplier[] = [{
      ...SUPPLIERS[0],
      addresses: [{ id: 'a-1', supplierId: 's-001', type: 'FISCAL', street: 'Calle de Recoletos 37' }],
    }]
    render(<SuppliersList {...defaultProps} suppliers={suppliers} />)
    expect(screen.getByText('Calle de Recoletos 37')).toBeInTheDocument()
  })

  it('shows dash when supplier has no address', () => {
    render(<SuppliersList {...defaultProps} />)
    // Mapfre and Endesa both have no addresses → two "—" cells for address column
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('hides delete buttons for EMPLOYEE', () => {
    mockRole = 'EMPLOYEE'
    render(<SuppliersList {...defaultProps} />)
    expect(screen.queryAllByTitle('suppliers.actions.delete')).toHaveLength(0)
  })
})
