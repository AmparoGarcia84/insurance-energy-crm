import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClientSalesTab from './ClientSalesTab'
import { SaleType, InsuranceSaleStage, EnergySaleStage } from '../../api/sales'
import type { Sale } from '../../api/sales'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'sales.new':                                          'New sale',
        'sales.card.savingsPerYear':                         '/year savings',
        'clients.salesTab.noSales':                          'No sales yet',
        'clients.salesTab.search':                           'Search sales...',
        'clients.salesTab.emptySearch':                      'No results',
        'sales.stages.insurance.RESPONSE_PENDING':           'Awaiting response',
        'sales.stages.insurance.LOST':                       'Lost',
        'sales.stages.energy.DOCUMENTS_PENDING':             'Awaiting documents',
      }
      if (key === 'sales.opportunitiesCount' && opts) return `${opts.count} opportunities`
      return map[key] ?? key
    },
  }),
}))

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { displayName: 'Mila García' } }),
}))

const mockUpsertSale = vi.fn()
const mockRemoveSale = vi.fn()
let mockSales: Sale[] = []
let mockLoading = false

vi.mock('../../context/DataContext', () => ({
  useSales: () => ({
    sales:      mockSales,
    loading:    mockLoading,
    upsertSale: mockUpsertSale,
    removeSale: mockRemoveSale,
  }),
}))

vi.mock('../SaleForm/SaleForm', () => ({
  default: ({ sale, defaultClientId, defaultClientName }: {
    sale: Sale | null
    defaultClientId?: string
    defaultClientName?: string
  }) => (
    <div
      data-testid="sale-form"
      data-sale-id={sale?.id ?? 'new'}
      data-client-id={defaultClientId}
      data-client-name={defaultClientName}
    />
  ),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeInsuranceSale = (id: string, overrides?: Partial<Sale>): Sale => ({
  id,
  clientId: 'client-a',
  clientName: 'Ana López',
  type: SaleType.INSURANCE,
  title: `Hogar - ${id}`,
  insuranceBranch: 'Hogar',
  insuranceStage: InsuranceSaleStage.RESPONSE_PENDING,
  expectedRevenue: 1200,
  createdAt: `2024-01-0${id}T10:00:00Z`,
  updatedAt: `2024-01-0${id}T10:00:00Z`,
  ...overrides,
})

const ENERGY_SALE: Sale = {
  id: 'e1',
  clientId: 'client-a',
  clientName: 'Ana López',
  type: SaleType.ENERGY,
  title: 'Luz - Ana López',
  companyName: 'Iberdrola',
  energyStage: EnergySaleStage.DOCUMENTS_PENDING,
  expectedSavingsPerYear: 800,
  createdAt: '2024-01-05T10:00:00Z',
  updatedAt: '2024-01-05T10:00:00Z',
}

const OTHER_CLIENT_SALE: Sale = {
  ...makeInsuranceSale('99'),
  clientId: 'client-b',
  clientName: 'Otro',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ClientSalesTab', () => {
  beforeEach(() => {
    mockSales = []
    mockLoading = false
    vi.clearAllMocks()
  })

  it('renders the new sale button', () => {
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={vi.fn()} />)
    expect(screen.getByText('New sale')).toBeInTheDocument()
  })

  it('shows empty state when client has no sales', () => {
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={vi.fn()} />)
    expect(screen.getByText('No sales yet')).toBeInTheDocument()
  })

  it('shows opportunities count', () => {
    mockSales = [makeInsuranceSale('1'), makeInsuranceSale('2')]
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={vi.fn()} />)
    expect(screen.getByText('2 opportunities')).toBeInTheDocument()
  })

  it('renders sale title without client name', () => {
    mockSales = [makeInsuranceSale('1')]
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={vi.fn()} />)
    expect(screen.getByText('Hogar - 1')).toBeInTheDocument()
    // client name should NOT appear as a standalone heading
    expect(screen.queryByRole('heading', { name: 'Ana López' })).toBeNull()
  })

  it('renders insurance branch badge', () => {
    mockSales = [makeInsuranceSale('1')]
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={vi.fn()} />)
    expect(screen.getByText('Hogar')).toBeInTheDocument()
  })

  it('renders stage label', () => {
    mockSales = [makeInsuranceSale('1')]
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={vi.fn()} />)
    expect(screen.getByText('Awaiting response')).toBeInTheDocument()
  })

  it('renders revenue', () => {
    mockSales = [makeInsuranceSale('1')]
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={vi.fn()} />)
    expect(screen.getByText(/1[.,]?200/)).toBeInTheDocument()
  })

  it('renders energy company badge and savings', () => {
    mockSales = [ENERGY_SALE]
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={vi.fn()} />)
    expect(screen.getByText('Iberdrola')).toBeInTheDocument()
    expect(screen.getByText(/800/)).toBeInTheDocument()
    expect(screen.getByText('Awaiting documents')).toBeInTheDocument()
  })

  it('does not show sales from other clients', () => {
    mockSales = [makeInsuranceSale('1'), OTHER_CLIENT_SALE]
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={vi.fn()} />)
    const rows = screen.getAllByRole('button')
    // only 1 sale row (plus the "new sale" button handled separately)
    expect(screen.queryByText('Hogar - 99')).toBeNull()
  })

  it('sorts sales newest first', () => {
    mockSales = [
      makeInsuranceSale('1', { createdAt: '2024-01-01T00:00:00Z' }),
      makeInsuranceSale('3', { createdAt: '2024-01-03T00:00:00Z' }),
      makeInsuranceSale('2', { createdAt: '2024-01-02T00:00:00Z' }),
    ]
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={vi.fn()} />)
    const titles = screen.getAllByText(/Hogar - \d/).map((el) => el.textContent)
    expect(titles).toEqual(['Hogar - 3', 'Hogar - 2', 'Hogar - 1'])
  })

  it('opens SaleForm with client pre-filled when clicking New sale', async () => {
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={vi.fn()} />)
    await userEvent.click(screen.getByText('New sale'))
    const form = screen.getByTestId('sale-form')
    expect(form).toBeInTheDocument()
    expect(form).toHaveAttribute('data-sale-id', 'new')
    expect(form).toHaveAttribute('data-client-id', 'client-a')
    expect(form).toHaveAttribute('data-client-name', 'Ana López')
  })

  it('calls onViewSale when clicking a sale row', async () => {
    const onViewSale = vi.fn()
    mockSales = [makeInsuranceSale('1')]
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={onViewSale} />)
    await userEvent.click(screen.getByText('Hogar - 1'))
    expect(onViewSale).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }))
  })

  it('renders nothing while loading', () => {
    mockLoading = true
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={vi.fn()} />)
    expect(screen.queryByText('No sales yet')).toBeNull()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('shows search input when there are sales', () => {
    mockSales = [makeInsuranceSale('1')]
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={vi.fn()} />)
    expect(screen.getByPlaceholderText('Search sales...')).toBeInTheDocument()
  })

  it('does not show search input when there are no sales', () => {
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={vi.fn()} />)
    expect(screen.queryByPlaceholderText('Search sales...')).toBeNull()
  })

  it('filters sales by title', async () => {
    mockSales = [makeInsuranceSale('1'), makeInsuranceSale('2', { title: 'Auto - 2' })]
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('Search sales...'), 'auto')
    expect(screen.queryByText('Hogar - 1')).toBeNull()
    expect(screen.getByText('Auto - 2')).toBeInTheDocument()
  })

  it('filters sales by branch', async () => {
    mockSales = [makeInsuranceSale('1'), makeInsuranceSale('2', { insuranceBranch: 'Vida', title: 'Vida - 2' })]
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('Search sales...'), 'vida')
    expect(screen.queryByText('Hogar - 1')).toBeNull()
    expect(screen.getByText('Vida - 2')).toBeInTheDocument()
  })

  it('shows empty search message when no results', async () => {
    mockSales = [makeInsuranceSale('1')]
    render(<ClientSalesTab clientId="client-a" clientName="Ana López" onViewSale={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('Search sales...'), 'zzznomatch')
    expect(screen.getByText('No results')).toBeInTheDocument()
  })
})
