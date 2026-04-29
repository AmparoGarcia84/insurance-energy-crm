import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import ClientDetail from './ClientDetail'
import type { Client } from '../../../api/clients'
import { ClientType, ClientStatus, AddressType, AccountType } from '@crm/shared'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'es' },
  }),
}))

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { userId: 'u1', role: 'OWNER', displayName: 'Test' } }),
}))

vi.mock('../../../context/DataContext', () => ({
  useSales:   () => ({ sales: [], loading: false, upsertSale: vi.fn(), removeSale: vi.fn() }),
  useClients: () => ({ clients: [] }),
  useCases:   () => ({ cases: [], loading: false, upsertCase: vi.fn(), removeCase: vi.fn() }),
}))

vi.mock('../../../api/tasks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/tasks')>()
  return { ...actual, getTasks: () => Promise.resolve([]) }
})

vi.mock('../../../api/documents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/documents')>()
  return { ...actual, getDocuments: () => Promise.resolve([]) }
})

vi.mock('../../../api/activities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/activities')>()
  return { ...actual, getActivities: () => Promise.resolve([]) }
})

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

function renderDetail(client = baseClient, props?: Partial<Parameters<typeof ClientDetail>[0]>) {
  return render(
    <MemoryRouter>
      <ClientDetail
        client={client}
        onBack={vi.fn()}
        onEdit={vi.fn()}
        onViewSale={vi.fn()}
        {...props}
      />
    </MemoryRouter>
  )
}

describe('ClientDetail', () => {
  const onBack = vi.fn()
  const onEdit = vi.fn()

  beforeEach(() => {
    onBack.mockClear()
    onEdit.mockClear()
  })

  it('renders client name in header', () => {
    renderDetail()
    expect(screen.getByRole('heading', { name: 'Ana García' })).toBeInTheDocument()
  })

  it('renders initials avatar', () => {
    renderDetail()
    expect(screen.getByText('AG')).toBeInTheDocument()
  })

  it('renders NIF', () => {
    renderDetail()
    expect(screen.getAllByText('12345678A').length).toBeGreaterThan(0)
  })

  it('calls onBack when back button is clicked', () => {
    renderDetail(baseClient, { onBack })
    fireEvent.click(screen.getByTitle('clients.detail.back'))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('calls onEdit with client when edit button is clicked', () => {
    renderDetail(baseClient, { onEdit })
    fireEvent.click(screen.getByText('clients.detail.edit'))
    expect(onEdit).toHaveBeenCalledWith(baseClient)
  })

  it('shows summary tab content by default', () => {
    renderDetail()
    expect(screen.getByText('clients.summary.openOpportunities')).toBeInTheDocument()
    expect(screen.getByText('clients.summary.pendingTasks')).toBeInTheDocument()
  })

  it('shows coming soon placeholder for unimplemented tabs (mail)', async () => {
    renderDetail()
    fireEvent.click(screen.getByText('clients.tabs.mail'))
    expect(screen.getByText('clients.detail.comingSoon')).toBeInTheDocument()
  })

  it('shows activity tab content when activity tab is clicked', async () => {
    renderDetail()
    fireEvent.click(screen.getByText('clients.tabs.activity'))
    await waitFor(() => {
      expect(screen.getByText('activities.noActivities')).toBeInTheDocument()
    })
  })

  it('renders documents tab with add button when documents tab is active', async () => {
    renderDetail()
    fireEvent.click(screen.getByText('clients.tabs.documents'))
    await waitFor(() => {
      expect(screen.getByText('documents.actions.add')).toBeInTheDocument()
    })
  })

  it('renders addresses when present — visible in info modal', async () => {
    const client: Client = {
      ...baseClient,
      addresses: [{ id: 'a1', type: AddressType.FISCAL, street: 'Calle Mayor 1', city: 'Madrid', postalCode: '28001' }],
    }
    renderDetail(client)
    fireEvent.click(screen.getByText('clients.detail.view'))
    await waitFor(() => {
      expect(screen.getByText('clients.sections.addresses')).toBeInTheDocument()
      expect(screen.getByText(/Calle Mayor 1/)).toBeInTheDocument()
    })
  })

  it('renders bank accounts when present — visible in info modal', async () => {
    const client: Client = {
      ...baseClient,
      bankAccounts: [{ id: 'b1', type: AccountType.PERSONAL, iban: 'ES12 3456 7890 1234 5678 90' }],
    }
    renderDetail(client)
    fireEvent.click(screen.getByText('clients.detail.view'))
    await waitFor(() => {
      expect(screen.getByText('clients.sections.bankAccounts')).toBeInTheDocument()
      expect(screen.getByText('ES12 3456 7890 1234 5678 90')).toBeInTheDocument()
    })
  })

  it('does not render addresses section when empty', async () => {
    renderDetail()
    fireEvent.click(screen.getByText('clients.detail.view'))
    await waitFor(() => {
      expect(screen.queryByText('clients.sections.addresses')).not.toBeInTheDocument()
    })
  })

  it('renders description when present — visible in info modal', async () => {
    const client: Client = { ...baseClient, description: 'Cliente muy importante' }
    renderDetail(client)
    fireEvent.click(screen.getByText('clients.detail.view'))
    await waitFor(() => {
      expect(screen.getByText('Cliente muy importante')).toBeInTheDocument()
    })
  })
})
