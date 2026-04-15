import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ClientInfoModal from './ClientInfoModal'
import type { Client } from '../../api/clients'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'es' },
  }),
}))

vi.mock('@crm/shared', () => ({
  ClientActivity: {},
  ClientSector: {},
  ClientTypeLabels: { INDIVIDUAL: 'Individual' },
  ClientStatusLabels: { ACTIVE: 'Active' },
  ClientQualificationLabels: {},
  CollectionManagerLabels: {},
  ClientActivityLabels: {},
  ClientSectorLabels: {},
  AddressTypeLabels: {},
  AccountTypeLabels: {},
}))

const mockClient: Client = {
  id: '1',
  name: 'Ana García',
  nif: '12345678A',
  clientNumber: 'CLI-001',
  mobilePhone: '600000000',
  email: 'ana@example.com',
  addresses: [],
  bankAccounts: [],
}

describe('ClientInfoModal', () => {
  it('renders the client name in the header', () => {
    render(<ClientInfoModal client={mockClient} onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Ana García' })).toBeInTheDocument()
  })

  it('has dialog role', () => {
    render(<ClientInfoModal client={mockClient} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    render(<ClientInfoModal client={mockClient} onClose={onClose} />)
    await userEvent.click(document.querySelector('.icon-btn')!)
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn()
    render(<ClientInfoModal client={mockClient} onClose={onClose} />)
    await userEvent.click(document.querySelector('.cim-backdrop')!)
    expect(onClose).toHaveBeenCalled()
  })

  it('does not call onClose when modal content is clicked', async () => {
    const onClose = vi.fn()
    render(<ClientInfoModal client={mockClient} onClose={onClose} />)
    await userEvent.click(document.querySelector('.cim-modal')!)
    expect(onClose).not.toHaveBeenCalled()
  })
})
