import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Clients from './Clients'
import { ClientType, ClientStatus } from '@crm/shared'
import type { Client } from '../../api/clients'
import { DataProvider } from '../../context/DataContext'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, string>) =>
    opts ? `${key}:${JSON.stringify(opts)}` : key
  }),
}))

const mockGetClients   = vi.fn()
const mockGetClient    = vi.fn()
const mockDeleteClient = vi.fn()
const mockImportClients = vi.fn()

vi.mock('../../api/clients', () => ({
  getClients:    (...args: unknown[]) => mockGetClients(...args),
  getClient:     (...args: unknown[]) => mockGetClient(...args),
  deleteClient:  (...args: unknown[]) => mockDeleteClient(...args),
  importClients: (...args: unknown[]) => mockImportClients(...args),
}))

// Lightweight stand-ins for the child components — they expose their callbacks
// via buttons so we can drive the orchestration logic from tests.
vi.mock('../ClientsList/ClientsList', () => ({
  default: ({ clients, loading, onNew, onView, onEdit, onDelete }: {
    clients: Client[]
    loading: boolean
    onNew: () => void
    onView: (c: Client) => void
    onEdit: (c: Client) => void
    onDelete: (c: Client) => void
  }) => (
    <div data-testid="clients-list">
      {loading && <span>loading</span>}
      {clients.map((c) => (
        <div key={c.id}>
          <span>{c.name}</span>
          <button onClick={() => onView(c)}>view-{c.id}</button>
          <button onClick={() => onEdit(c)}>edit-{c.id}</button>
          <button onClick={() => onDelete(c)}>delete-{c.id}</button>
        </div>
      ))}
      <button onClick={onNew}>new</button>
    </div>
  ),
}))

vi.mock('../ClientDetail/ClientDetail', () => ({
  default: ({ client, onBack, onEdit }: {
    client: Client
    onBack: () => void
    onEdit: (c: Client) => void
  }) => (
    <div data-testid="client-detail">
      <span>{client.name}</span>
      <button onClick={onBack}>back</button>
      <button onClick={() => onEdit(client)}>edit</button>
    </div>
  ),
}))

vi.mock('../ClientForm/ClientForm', () => ({
  default: ({ client, onSave, onCancel }: {
    client: Client | null
    onSave: (c: Client) => void
    onCancel: () => void
  }) => (
    <div data-testid="client-form">
      <span>{client ? `editing:${client.id}` : 'new'}</span>
      <button onClick={() => onSave({ ...mockClients[0], name: 'Updated' })}>save</button>
      <button onClick={onCancel}>cancel</button>
    </div>
  ),
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockClients: Client[] = [
  {
    id: '1', clientNumber: '000001', name: 'Ana García', nif: '12345678A',
    type: ClientType.INDIVIDUAL, status: ClientStatus.ACTIVE,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2', clientNumber: '000002', name: 'Blas López',
    type: ClientType.BUSINESS, status: ClientStatus.LEAD,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
]

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Clients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetClients.mockResolvedValue(mockClients)
  })

  it('renders ClientsList after loading', async () => {
    render(<DataProvider><Clients /></DataProvider>)
    await waitFor(() => expect(screen.getByText('Ana García')).toBeInTheDocument())
    expect(screen.getByText('Blas López')).toBeInTheDocument()
  })

  it('shows ClientDetail when a client is viewed', async () => {
    render(<DataProvider><Clients /></DataProvider>)
    await waitFor(() => screen.getByText('view-1'))
    fireEvent.click(screen.getByText('view-1'))
    expect(screen.getByTestId('client-detail')).toBeInTheDocument()
    expect(screen.getByText('Ana García')).toBeInTheDocument()
  })

  it('returns to list when back is clicked in ClientDetail', async () => {
    render(<DataProvider><Clients /></DataProvider>)
    await waitFor(() => screen.getByText('view-1'))
    fireEvent.click(screen.getByText('view-1'))
    fireEvent.click(screen.getByText('back'))
    expect(screen.getByTestId('clients-list')).toBeInTheDocument()
  })

  it('shows ClientForm for a new client when new is clicked', async () => {
    render(<DataProvider><Clients /></DataProvider>)
    await waitFor(() => screen.getByText('new'))
    fireEvent.click(screen.getByText('new'))
    expect(screen.getByTestId('client-form')).toBeInTheDocument()
    expect(screen.getByText('new')).toBeInTheDocument()
  })

  it('shows ClientForm with existing client when edit is clicked', async () => {
    render(<DataProvider><Clients /></DataProvider>)
    await waitFor(() => screen.getByText('edit-1'))
    fireEvent.click(screen.getByText('edit-1'))
    expect(screen.getByTestId('client-form')).toBeInTheDocument()
    expect(screen.getByText('editing:1')).toBeInTheDocument()
  })

  it('returns to list when cancel is clicked in ClientForm', async () => {
    render(<DataProvider><Clients /></DataProvider>)
    await waitFor(() => screen.getByText('new'))
    fireEvent.click(screen.getByText('new'))
    fireEvent.click(screen.getByText('cancel'))
    expect(screen.getByTestId('clients-list')).toBeInTheDocument()
  })

  it('updates the list and closes form when a client is saved', async () => {
    render(<DataProvider><Clients /></DataProvider>)
    await waitFor(() => screen.getByText('new'))
    fireEvent.click(screen.getByText('new'))
    fireEvent.click(screen.getByText('save'))
    expect(screen.getByTestId('clients-list')).toBeInTheDocument()
    expect(screen.getByText('Updated')).toBeInTheDocument()
  })

  it('removes deleted client from the list', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockDeleteClient.mockResolvedValue(undefined)

    render(<DataProvider><Clients /></DataProvider>)
    await waitFor(() => screen.getByText('delete-1'))
    fireEvent.click(screen.getByText('delete-1'))

    await waitFor(() => expect(screen.queryByText('Ana García')).not.toBeInTheDocument())
    expect(mockDeleteClient).toHaveBeenCalledWith('1')
  })

  it('does not delete when confirm is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<DataProvider><Clients /></DataProvider>)
    await waitFor(() => screen.getByText('delete-1'))
    fireEvent.click(screen.getByText('delete-1'))

    expect(mockDeleteClient).not.toHaveBeenCalled()
    expect(screen.getByText('Ana García')).toBeInTheDocument()
  })

  it('shows ClientForm when edit is clicked from ClientDetail', async () => {
    mockGetClient.mockResolvedValue(mockClients[0])

    render(<DataProvider><Clients /></DataProvider>)
    await waitFor(() => screen.getByText('view-1'))
    fireEvent.click(screen.getByText('view-1'))
    fireEvent.click(screen.getByText('edit'))
    expect(screen.getByTestId('client-form')).toBeInTheDocument()
    expect(screen.getByText('editing:1')).toBeInTheDocument()
  })
})
