import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ClientForm from './ClientForm'
import { ClientType, ClientStatus } from '@crm/shared'
import type { Client } from '../../api/clients'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../context/DataContext', () => ({
  useClients: () => ({ clients: [], loading: false }),
  useUsers: () => ({ users: [], loading: false }),
  useCollaborators: () => ({ collaborators: [], loading: false }),
}))

vi.mock('../../api/clients', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/clients')>()
  return {
    ...actual,
    createClient: vi.fn(),
    updateClient: vi.fn(),
  }
})

const { createClient, updateClient } = await import('../../api/clients')

const savedClient: Client = {
  id: '1',
  name: 'Ana García',
  type: ClientType.INDIVIDUAL,
  status: ClientStatus.ACTIVE,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('ClientForm', () => {
  const onSave = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => {
    onSave.mockClear()
    onCancel.mockClear()
    vi.mocked(createClient).mockResolvedValue(savedClient)
    vi.mocked(updateClient).mockResolvedValue(savedClient)
  })

  it('renders new client title when client is null', () => {
    render(<ClientForm client={null} onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('clients.new')).toBeInTheDocument()
  })

  it('renders edit title when client is provided', () => {
    render(<ClientForm client={savedClient} onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('clients.edit')).toBeInTheDocument()
  })

  it('prefills form with client values', () => {
    render(<ClientForm client={savedClient} onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByDisplayValue('Ana García')).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(<ClientForm client={null} onSave={onSave} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('clients.actions.cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('save button is disabled when name is empty', () => {
    render(<ClientForm client={null} onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('clients.actions.save')).toBeDisabled()
  })

  it('save button is disabled when name is filled but NIF is empty and status is not PROSPECTING', () => {
    render(<ClientForm client={null} onSave={onSave} onCancel={onCancel} />)
    fireEvent.change(screen.getByLabelText(/clients.fields.name/i), { target: { value: 'Test' } })
    expect(screen.getByText('clients.actions.save')).toBeDisabled()
  })

  it('save button is enabled when name and NIF are filled', () => {
    render(<ClientForm client={null} onSave={onSave} onCancel={onCancel} />)
    fireEvent.change(screen.getByLabelText(/clients.fields.name/i), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText(/clients.fields.nif/i), { target: { value: '12345678A' } })
    expect(screen.getByText('clients.actions.save')).not.toBeDisabled()
  })

  it('save button is enabled when name is filled and status is PROSPECTING even without NIF', () => {
    render(<ClientForm client={null} onSave={onSave} onCancel={onCancel} />)
    fireEvent.change(screen.getByLabelText(/clients.fields.name/i), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText(/clients.fields.status/i), { target: { value: ClientStatus.PROSPECTING } })
    expect(screen.getByText('clients.actions.save')).not.toBeDisabled()
  })

  it('calls createClient and onSave when submitting new client', async () => {
    render(<ClientForm client={null} onSave={onSave} onCancel={onCancel} />)
    fireEvent.change(screen.getByLabelText(/clients.fields.name/i), { target: { value: 'Ana García' } })
    fireEvent.submit(screen.getByText('clients.actions.save').closest('form')!)
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(savedClient))
    expect(createClient).toHaveBeenCalled()
  })

  it('calls updateClient and onSave when submitting existing client', async () => {
    render(<ClientForm client={savedClient} onSave={onSave} onCancel={onCancel} />)
    fireEvent.submit(screen.getByText('clients.actions.save').closest('form')!)
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(savedClient))
    expect(updateClient).toHaveBeenCalledWith('1', expect.any(Object))
  })
})
