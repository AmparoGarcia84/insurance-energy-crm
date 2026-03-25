import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ClientsList from './ClientsList'
import { ClientType, ClientStatus } from '@crm/shared'
import type { Client } from '../../api/clients'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'OWNER' } }),
}))

const clients: Client[] = [
  {
    id: '1', name: 'Ana García', nif: '12345678A',
    type: ClientType.INDIVIDUAL, status: ClientStatus.ACTIVE,
    email: 'ana@example.com', mobilePhone: '600111222',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2', name: 'Blas López',
    type: ClientType.BUSINESS, status: ClientStatus.LEAD,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
]

describe('ClientsList', () => {
  const onNew    = vi.fn()
  const onView   = vi.fn()
  const onEdit   = vi.fn()
  const onDelete = vi.fn()

  const defaultProps = { clients, loading: false, onNew, onView, onEdit, onDelete }

  beforeEach(() => { onNew.mockClear(); onView.mockClear(); onEdit.mockClear(); onDelete.mockClear() })

  it('renders client rows', () => {
    render(<ClientsList {...defaultProps} />)
    expect(screen.getByText('Ana García')).toBeInTheDocument()
    expect(screen.getByText('Blas López')).toBeInTheDocument()
  })

  it('shows empty state when no clients', () => {
    render(<ClientsList {...defaultProps} clients={[]} />)
    expect(screen.getByText('clients.empty')).toBeInTheDocument()
  })

  it('shows loading state (no table)', () => {
    render(<ClientsList {...defaultProps} loading={true} />)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('filters by search', () => {
    render(<ClientsList {...defaultProps} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'ana' } })
    expect(screen.getByText('Ana García')).toBeInTheDocument()
    expect(screen.queryByText('Blas López')).not.toBeInTheDocument()
  })

  it('shows empty search state when no results', () => {
    render(<ClientsList {...defaultProps} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz' } })
    expect(screen.getByText('clients.emptySearch')).toBeInTheDocument()
  })

  it('calls onNew when new button is clicked', () => {
    render(<ClientsList {...defaultProps} />)
    fireEvent.click(screen.getByText('clients.new'))
    expect(onNew).toHaveBeenCalledOnce()
  })

  it('calls onView when a row is clicked', () => {
    render(<ClientsList {...defaultProps} />)
    fireEvent.click(screen.getByText('Ana García'))
    expect(onView).toHaveBeenCalledWith(clients[0])
  })

  it('calls onEdit when edit button is clicked', () => {
    render(<ClientsList {...defaultProps} />)
    fireEvent.click(screen.getAllByTitle('clients.edit')[0])
    expect(onEdit).toHaveBeenCalledWith(clients[0])
  })

  it('calls onDelete when delete button is clicked', () => {
    render(<ClientsList {...defaultProps} />)
    fireEvent.click(screen.getAllByTitle('clients.actions.delete')[0])
    expect(onDelete).toHaveBeenCalledWith(clients[0])
  })

  it('does not propagate row click when action buttons are clicked', () => {
    render(<ClientsList {...defaultProps} />)
    fireEvent.click(screen.getAllByTitle('clients.edit')[0])
    expect(onView).not.toHaveBeenCalled()
  })
})
