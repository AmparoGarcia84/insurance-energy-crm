import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ClientSummaryTab from './ClientSummaryTab'
import { relativeDate } from '../../shared/ActivityListCard/ActivityListCard'
import { SaleType, InsuranceSaleStage, EnergySaleStage } from '../../../api/sales'
import type { Sale } from '../../../api/sales'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'clients.summary.openOpportunities': 'Open opportunities',
        'clients.summary.noSales':           'No open opportunities',
        'clients.summary.pendingTasks':      'Pending tasks',
        'clients.summary.noTasks':           'No pending tasks',
        'clients.summary.recentActivity':    'Recent activity',
        'clients.summary.noActivity':        'No activity recorded',
        'clients.detail.comingSoon':         'Coming soon',
        'sales.card.savingsPerYear':         '/year savings',
      }
      if (key === 'sales.opportunitiesCount' && opts) {
        return `${opts.count} opportunities`
      }
      return map[key] ?? key
    },
  }),
}))

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { displayName: 'Mila García' } }),
}))

const mockUpsertSale = vi.fn()
const mockRemoveSale = vi.fn()
let mockSales: Sale[] = []
let mockLoading = false

vi.mock('../../../context/DataContext', () => ({
  useSales: () => ({
    sales:       mockSales,
    loading:     mockLoading,
    upsertSale:  mockUpsertSale,
    removeSale:  mockRemoveSale,
  }),
}))

vi.mock('../../sales/SaleCard/SaleCard', () => ({
  default: ({ sale }: { sale: Sale }) => (
    <div data-testid="sale-card">{sale.title}</div>
  ),
}))


// ── Fixtures ─────────────────────────────────────────────────────────────────

const OPEN_INSURANCE: Sale = {
  id: '1',
  clientId: 'client-a',
  clientName: 'Ana López',
  type: SaleType.INSURANCE,
  title: 'Hogar - Ana López',
  insuranceStage: InsuranceSaleStage.RESPONSE_PENDING,
  createdAt: '',
  updatedAt: '',
}

const CLOSED_INSURANCE: Sale = {
  id: '2',
  clientId: 'client-a',
  clientName: 'Ana López',
  type: SaleType.INSURANCE,
  title: 'Vida - Ana López',
  insuranceStage: InsuranceSaleStage.LOST,
  createdAt: '',
  updatedAt: '',
}

const OPEN_ENERGY: Sale = {
  id: '3',
  clientId: 'client-a',
  clientName: 'Ana López',
  type: SaleType.ENERGY,
  title: 'Luz - Ana López',
  energyStage: EnergySaleStage.DOCUMENTS_PENDING,
  createdAt: '',
  updatedAt: '',
}

const OTHER_CLIENT_SALE: Sale = {
  id: '4',
  clientId: 'client-b',
  clientName: 'Otro Cliente',
  type: SaleType.INSURANCE,
  title: 'Hogar - Otro',
  insuranceStage: InsuranceSaleStage.RESPONSE_PENDING,
  createdAt: '',
  updatedAt: '',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ClientSummaryTab', () => {
  beforeEach(() => {
    mockSales = []
    mockLoading = false
    vi.clearAllMocks()
  })

  it('renders the open opportunities card title', () => {
    render(<ClientSummaryTab clientId="client-a" onViewSale={vi.fn()} />)
    expect(screen.getByText('Open opportunities')).toBeInTheDocument()
  })

  it('shows empty state when client has no open sales', () => {
    mockSales = [CLOSED_INSURANCE]
    render(<ClientSummaryTab clientId="client-a" onViewSale={vi.fn()} />)
    expect(screen.getByText('No open opportunities')).toBeInTheDocument()
    expect(screen.queryByTestId('sale-card')).toBeNull()
  })

  it('shows open insurance sales for the client', () => {
    mockSales = [OPEN_INSURANCE, CLOSED_INSURANCE]
    render(<ClientSummaryTab clientId="client-a" onViewSale={vi.fn()} />)
    expect(screen.getByText('Hogar - Ana López')).toBeInTheDocument()
    expect(screen.queryByText('Vida - Ana López')).toBeNull()
  })

  it('shows open energy sales for the client', () => {
    mockSales = [OPEN_ENERGY]
    render(<ClientSummaryTab clientId="client-a" onViewSale={vi.fn()} />)
    expect(screen.getByText('Luz - Ana López')).toBeInTheDocument()
  })

  it('does not show sales from other clients', () => {
    mockSales = [OPEN_INSURANCE, OTHER_CLIENT_SALE]
    render(<ClientSummaryTab clientId="client-a" onViewSale={vi.fn()} />)
    expect(screen.queryByText('Hogar - Otro')).toBeNull()
  })

  it('shows count badge when there are open sales', () => {
    mockSales = [OPEN_INSURANCE, OPEN_ENERGY]
    render(<ClientSummaryTab clientId="client-a" onViewSale={vi.fn()} />)
    expect(screen.getByText('2 opportunities')).toBeInTheDocument()
  })

  it('does not show count badge when no open sales', () => {
    render(<ClientSummaryTab clientId="client-a" onViewSale={vi.fn()} />)
    expect(document.querySelector('.cd-summary__card-count')).toBeNull()
  })

  it('renders the pending tasks card title', () => {
    render(<ClientSummaryTab clientId="client-a" onViewSale={vi.fn()} />)
    expect(screen.getByText('Pending tasks')).toBeInTheDocument()
  })

  it('renders pending tasks empty state', () => {
    render(<ClientSummaryTab clientId="client-a" onViewSale={vi.fn()} />)
    expect(screen.getByText('No pending tasks')).toBeInTheDocument()
  })

  it('renders the recent activity card title', () => {
    render(<ClientSummaryTab clientId="client-a" onViewSale={vi.fn()} />)
    expect(screen.getByText('Recent activity')).toBeInTheDocument()
  })

  it('renders recent activity empty state', () => {
    render(<ClientSummaryTab clientId="client-a" onViewSale={vi.fn()} />)
    expect(screen.getByText('No activity recorded')).toBeInTheDocument()
  })

  it('renders nothing while loading', () => {
    mockLoading = true
    render(<ClientSummaryTab clientId="client-a" onViewSale={vi.fn()} />)
    expect(screen.queryByTestId('sale-card')).toBeNull()
    expect(screen.queryByText('No open opportunities')).toBeNull()
  })
})

// ── relativeDate ──────────────────────────────────────────────────────────────

describe('relativeDate', () => {
  function isoAgo(ms: number): string {
    return new Date(Date.now() - ms).toISOString()
  }

  it('returns "ahora" for less than 1 minute ago', () => {
    expect(relativeDate(isoAgo(30_000))).toBe('ahora')
  })

  it('returns minutes for less than 1 hour ago', () => {
    expect(relativeDate(isoAgo(15 * 60_000))).toBe('hace 15 min')
  })

  it('returns hours for less than 24 hours ago', () => {
    expect(relativeDate(isoAgo(3 * 3_600_000))).toBe('hace 3h')
  })

  it('returns "ayer" for 1 day ago', () => {
    expect(relativeDate(isoAgo(25 * 3_600_000))).toBe('ayer')
  })

  it('returns days for less than 30 days ago', () => {
    expect(relativeDate(isoAgo(5 * 86_400_000))).toBe('hace 5 días')
  })

  it('returns "hace 1 mes" for roughly 1 month ago', () => {
    expect(relativeDate(isoAgo(35 * 86_400_000))).toBe('hace 1 mes')
  })

  it('returns months for older dates', () => {
    expect(relativeDate(isoAgo(90 * 86_400_000))).toBe('hace 3 meses')
  })
})
