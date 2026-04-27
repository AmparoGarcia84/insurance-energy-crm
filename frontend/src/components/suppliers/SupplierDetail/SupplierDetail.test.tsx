import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SupplierDetail from './SupplierDetail'
import type { Supplier } from '../../../api/suppliers'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, unknown>) =>
    opts ? `${key}:${JSON.stringify(opts)}` : key
  }),
}))

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'OWNER' } }),
}))

vi.mock('../../../api/tasks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/tasks')>()
  return { ...actual, getTasks: vi.fn().mockResolvedValue([]), getUsers: vi.fn().mockResolvedValue([]) }
})

vi.mock('../../../api/users', () => ({
  getUsers: vi.fn().mockResolvedValue([]),
}))

const SUPPLIER: Supplier = {
  id: 's-001',
  name: 'Mapfre España S.A.',
  cif: 'A11111110',
  phone: '91 581 91 00',
  secondaryPhone: '900 100 128',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  addresses: [
    {
      id: 'a-1',
      supplierId: 's-001',
      type: 'FISCAL',
      street: 'Calle de Recoletos 37',
      postalCode: '28004',
      city: 'Madrid',
      province: 'Madrid',
      country: 'España',
    },
  ],
  emails: [
    { id: 'e-1', supplierId: 's-001', address: 'info@mapfre.com', isPrimary: true },
  ],
}

describe('SupplierDetail', () => {
  const onBack = vi.fn()
  const onEdit = vi.fn()

  beforeEach(() => vi.clearAllMocks())

  it('renders supplier name in header', () => {
    render(<SupplierDetail supplier={SUPPLIER} onBack={onBack} onEdit={onEdit} />)
    expect(screen.getByRole('heading', { name: 'Mapfre España S.A.' })).toBeInTheDocument()
  })

  it('renders initials avatar', () => {
    render(<SupplierDetail supplier={SUPPLIER} onBack={onBack} onEdit={onEdit} />)
    expect(screen.getByText('ME')).toBeInTheDocument()
  })

  it('renders CIF badge in header', () => {
    render(<SupplierDetail supplier={SUPPLIER} onBack={onBack} onEdit={onEdit} />)
    expect(screen.getAllByText('A11111110').length).toBeGreaterThan(0)
  })

  it('renders phone in header meta', () => {
    render(<SupplierDetail supplier={SUPPLIER} onBack={onBack} onEdit={onEdit} />)
    expect(screen.getAllByText('91 581 91 00').length).toBeGreaterThan(0)
  })

  it('renders primary email in header meta', () => {
    render(<SupplierDetail supplier={SUPPLIER} onBack={onBack} onEdit={onEdit} />)
    expect(screen.getAllByText('info@mapfre.com').length).toBeGreaterThan(0)
  })

  it('calls onBack when back button is clicked', () => {
    render(<SupplierDetail supplier={SUPPLIER} onBack={onBack} onEdit={onEdit} />)
    fireEvent.click(screen.getByTitle('suppliers.detail.back'))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('calls onEdit with supplier when edit button is clicked', () => {
    render(<SupplierDetail supplier={SUPPLIER} onBack={onBack} onEdit={onEdit} />)
    fireEvent.click(screen.getByText('suppliers.detail.editBtn'))
    expect(onEdit).toHaveBeenCalledWith(SUPPLIER)
  })

  it('shows Info tab content by default', () => {
    render(<SupplierDetail supplier={SUPPLIER} onBack={onBack} onEdit={onEdit} />)
    expect(screen.getByText('suppliers.fields.name')).toBeInTheDocument()
  })

  it('shows address section in Info tab', () => {
    render(<SupplierDetail supplier={SUPPLIER} onBack={onBack} onEdit={onEdit} />)
    expect(screen.getByText('Calle de Recoletos 37')).toBeInTheDocument()
    expect(screen.getByText('28004 Madrid')).toBeInTheDocument()
  })

  it('shows email section in Info tab', () => {
    render(<SupplierDetail supplier={SUPPLIER} onBack={onBack} onEdit={onEdit} />)
    expect(screen.getByText('suppliers.fields.email')).toBeInTheDocument()
  })

  it('switches to Tasks tab and shows empty state', async () => {
    render(<SupplierDetail supplier={SUPPLIER} onBack={onBack} onEdit={onEdit} />)
    fireEvent.click(screen.getByText('suppliers.detail.tabs.tasks'))
    await waitFor(() => {
      expect(screen.getByText('tasks.noTasks')).toBeInTheDocument()
    })
  })

  it('shows new task button in Tasks tab', async () => {
    render(<SupplierDetail supplier={SUPPLIER} onBack={onBack} onEdit={onEdit} />)
    fireEvent.click(screen.getByText('suppliers.detail.tabs.tasks'))
    await waitFor(() => {
      expect(screen.getByText('tasks.newTask')).toBeInTheDocument()
    })
  })

  it('does not show address section when no addresses', () => {
    const supplier: Supplier = { ...SUPPLIER, addresses: [] }
    render(<SupplierDetail supplier={supplier} onBack={onBack} onEdit={onEdit} />)
    expect(screen.queryByText('suppliers.fields.address')).not.toBeInTheDocument()
  })

  it('does not show email section when no emails', () => {
    const supplier: Supplier = { ...SUPPLIER, emails: [] }
    render(<SupplierDetail supplier={supplier} onBack={onBack} onEdit={onEdit} />)
    expect(screen.queryByText('suppliers.fields.email')).not.toBeInTheDocument()
  })
})
