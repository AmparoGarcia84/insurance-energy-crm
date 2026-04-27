import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SupplierForm from './SupplierForm'
import type { Supplier } from '../../../api/suppliers'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// AddressList and EmailList render add-item buttons; keep them as lightweight stubs
// so the tests focus on SupplierForm logic without pulling in child component complexity.
vi.mock('../../shared/AddressList/AddressList', () => ({
  default: ({ onChange }: { onChange: (v: unknown[]) => void }) => (
    <div data-testid="address-list">
      <button type="button" onClick={() => onChange([{ type: 'FISCAL', street: 'Calle Test 1' }])}>
        add-address
      </button>
    </div>
  ),
}))

vi.mock('../../shared/EmailList/EmailList', () => ({
  default: ({ onChange }: { onChange: (v: unknown[]) => void }) => (
    <div data-testid="email-list">
      <button type="button" onClick={() => onChange([{ address: 'test@test.com', isPrimary: true }])}>
        add-email
      </button>
    </div>
  ),
}))

const SUPPLIER: Supplier = {
  id: 's-001', name: 'Mapfre España S.A.', cif: 'A11111110',
  phone: '91 581 91 00', secondaryPhone: '900 100 128',
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  addresses: [], emails: [],
}

describe('SupplierForm', () => {
  const onSave    = vi.fn()
  const onCancel  = vi.fn()
  const onSubmit  = vi.fn()

  beforeEach(() => vi.clearAllMocks())

  it('renders new form title when supplier is null', () => {
    render(<SupplierForm supplier={null} onSave={onSave} onCancel={onCancel} onSubmit={onSubmit} />)
    expect(screen.getByText('suppliers.new')).toBeInTheDocument()
  })

  it('renders edit form title when supplier is provided', () => {
    render(<SupplierForm supplier={SUPPLIER} onSave={onSave} onCancel={onCancel} onSubmit={onSubmit} />)
    expect(screen.getByText('suppliers.edit')).toBeInTheDocument()
  })

  it('pre-fills fields when editing', () => {
    render(<SupplierForm supplier={SUPPLIER} onSave={onSave} onCancel={onCancel} onSubmit={onSubmit} />)
    expect(screen.getByDisplayValue('Mapfre España S.A.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('A11111110')).toBeInTheDocument()
    expect(screen.getByDisplayValue('91 581 91 00')).toBeInTheDocument()
  })

  it('renders address list and email list sections', () => {
    render(<SupplierForm supplier={null} onSave={onSave} onCancel={onCancel} onSubmit={onSubmit} />)
    expect(screen.getByTestId('address-list')).toBeInTheDocument()
    expect(screen.getByTestId('email-list')).toBeInTheDocument()
  })

  it('shows error when name is empty on submit', async () => {
    render(<SupplierForm supplier={null} onSave={onSave} onCancel={onCancel} onSubmit={onSubmit} />)
    fireEvent.submit(screen.getByText('suppliers.actions.save').closest('form')!)
    await waitFor(() => {
      expect(screen.getByText('suppliers.errors.nameRequired')).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct payload on valid submit', async () => {
    const saved = { ...SUPPLIER, id: 's-new' }
    onSubmit.mockResolvedValue(saved)
    render(<SupplierForm supplier={null} onSave={onSave} onCancel={onCancel} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('suppliers.fields.name *'), { target: { value: 'Nuevo S.L.' } })
    fireEvent.change(screen.getByLabelText('suppliers.fields.cif'),    { target: { value: 'C33333330' } })
    fireEvent.click(screen.getByText('suppliers.actions.save'))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(saved))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Nuevo S.L.', cif: 'C33333330' }))
  })

  it('includes addresses and emails in the submit payload', async () => {
    const saved = { ...SUPPLIER, id: 's-new' }
    onSubmit.mockResolvedValue(saved)
    render(<SupplierForm supplier={null} onSave={onSave} onCancel={onCancel} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('suppliers.fields.name *'), { target: { value: 'Test S.L.' } })
    fireEvent.click(screen.getByText('add-address'))
    fireEvent.click(screen.getByText('add-email'))
    fireEvent.click(screen.getByText('suppliers.actions.save'))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      addresses: [{ type: 'FISCAL', street: 'Calle Test 1' }],
      emails:    [{ address: 'test@test.com', isPrimary: true }],
    }))
  })

  it('shows CIF invalid error when backend returns 400', async () => {
    const err = Object.assign(new Error('CIF'), { status: 400, body: { error: 'Invalid CIF format' } })
    onSubmit.mockRejectedValue(err)
    render(<SupplierForm supplier={null} onSave={onSave} onCancel={onCancel} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('suppliers.fields.name *'), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText('suppliers.fields.cif'),    { target: { value: 'BADCIF' } })
    fireEvent.click(screen.getByText('suppliers.actions.save'))

    await waitFor(() => {
      expect(screen.getByText('suppliers.errors.cifInvalid')).toBeInTheDocument()
    })
  })

  it('shows duplicate CIF error when backend returns 409', async () => {
    const err = Object.assign(new Error('dup'), { status: 409, body: {} })
    onSubmit.mockRejectedValue(err)
    render(<SupplierForm supplier={null} onSave={onSave} onCancel={onCancel} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('suppliers.fields.name *'), { target: { value: 'Test' } })
    fireEvent.click(screen.getByText('suppliers.actions.save'))

    await waitFor(() => {
      expect(screen.getByText('suppliers.errors.cifDuplicate')).toBeInTheDocument()
    })
  })

  it('calls onCancel when cancel button clicked', () => {
    render(<SupplierForm supplier={null} onSave={onSave} onCancel={onCancel} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByText('suppliers.actions.cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
