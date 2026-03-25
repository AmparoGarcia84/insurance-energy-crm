import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ClientDetail from './ClientDetail'
import type { Client } from '../../api/clients'
import { ClientType, ClientStatus, AddressType, AccountType } from '@crm/shared'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const baseClient: Client = {
  id: '1',
  name: 'Ana García',
  type: ClientType.INDIVIDUAL,
  status: ClientStatus.ACTIVE,
  nif: '12345678A',
  mobilePhone: '600123456',
  email: 'ana@example.com',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('ClientDetail', () => {
  const onBack = vi.fn()
  const onEdit = vi.fn()

  beforeEach(() => {
    onBack.mockClear()
    onEdit.mockClear()
  })

  it('renders client name in header', () => {
    render(<ClientDetail client={baseClient} onBack={onBack} onEdit={onEdit} />)
    expect(screen.getByRole('heading', { name: 'Ana García' })).toBeInTheDocument()
  })

  it('renders initials avatar', () => {
    render(<ClientDetail client={baseClient} onBack={onBack} onEdit={onEdit} />)
    expect(screen.getByText('AG')).toBeInTheDocument()
  })

  it('renders NIF', () => {
    render(<ClientDetail client={baseClient} onBack={onBack} onEdit={onEdit} />)
    expect(screen.getAllByText('12345678A').length).toBeGreaterThan(0)
  })

  it('calls onBack when back button is clicked', () => {
    render(<ClientDetail client={baseClient} onBack={onBack} onEdit={onEdit} />)
    fireEvent.click(screen.getByTitle('clients.detail.back'))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('calls onEdit with client when edit button is clicked', () => {
    render(<ClientDetail client={baseClient} onBack={onBack} onEdit={onEdit} />)
    fireEvent.click(screen.getByText('clients.detail.edit'))
    expect(onEdit).toHaveBeenCalledWith(baseClient)
  })

  it('shows info tab content by default', () => {
    render(<ClientDetail client={baseClient} onBack={onBack} onEdit={onEdit} />)
    expect(screen.getByText('clients.sections.identification')).toBeInTheDocument()
  })

  it('shows coming soon placeholder for non-info tabs', () => {
    render(<ClientDetail client={baseClient} onBack={onBack} onEdit={onEdit} />)
    fireEvent.click(screen.getByText('clients.tabs.sales'))
    expect(screen.getByText('clients.detail.comingSoon')).toBeInTheDocument()
  })

  it('renders addresses when present', () => {
    const client: Client = {
      ...baseClient,
      addresses: [{ id: 'a1', type: AddressType.FISCAL, street: 'Calle Mayor 1', city: 'Madrid', postalCode: '28001' }],
    }
    render(<ClientDetail client={client} onBack={onBack} onEdit={onEdit} />)
    expect(screen.getByText('clients.sections.addresses')).toBeInTheDocument()
    expect(screen.getByText(/Calle Mayor 1/)).toBeInTheDocument()
  })

  it('renders bank accounts when present', () => {
    const client: Client = {
      ...baseClient,
      bankAccounts: [{ id: 'b1', type: AccountType.PERSONAL, iban: 'ES12 3456 7890 1234 5678 90' }],
    }
    render(<ClientDetail client={client} onBack={onBack} onEdit={onEdit} />)
    expect(screen.getByText('clients.sections.bankAccounts')).toBeInTheDocument()
    expect(screen.getByText('ES12 3456 7890 1234 5678 90')).toBeInTheDocument()
  })

  it('does not render addresses section when empty', () => {
    render(<ClientDetail client={baseClient} onBack={onBack} onEdit={onEdit} />)
    expect(screen.queryByText('clients.sections.addresses')).not.toBeInTheDocument()
  })

  it('renders description when present', () => {
    const client: Client = { ...baseClient, description: 'Cliente muy importante' }
    render(<ClientDetail client={client} onBack={onBack} onEdit={onEdit} />)
    expect(screen.getByText('Cliente muy importante')).toBeInTheDocument()
  })
})
