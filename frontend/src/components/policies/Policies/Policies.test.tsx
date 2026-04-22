import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Policies from './Policies'
import { SaleType, InsuranceSaleStage } from '../../../api/sales'
import type { Sale } from '../../../api/sales'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'policies.title':                              'Pólizas',
        'policies.search':                             'Buscar...',
        'policies.empty':                              'No hay pólizas',
        'policies.emptySearch':                        'Sin resultados',
        'policies.columns.client':                     'Cliente',
        'policies.columns.title':                      'Título / Ramo',
        'policies.columns.stage':                      'Etapa',
        'policies.columns.revenue':                    'Ingreso esperado',
        'policies.columns.policyNumber':               'Nº póliza',
        'policies.columns.owner':                      'Responsable',
        'sales.edit':                                  'Editar',
        'sales.stages.insurance.RESPONSE_PENDING':     'Pte. respuesta',
        'sales.stages.insurance.BILLED_AND_PAID':      'Cobrado',
      }
      return map[key] ?? key
    },
  }),
}))

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { displayName: 'Mila García', role: 'OWNER' } }),
}))

const mockUpsertSale = vi.fn()
const mockRemoveSale = vi.fn()
let mockSales: Sale[] = []
let mockLoading = false

vi.mock('../../../context/DataContext', () => ({
  useSales: () => ({
    sales:      mockSales,
    loading:    mockLoading,
    upsertSale: mockUpsertSale,
    removeSale: mockRemoveSale,
  }),
}))

vi.mock('../../sales/SaleDetail/SaleDetail', () => ({
  default: ({ sale }: { sale: Sale }) => <div data-testid="sale-detail">{sale.title}</div>,
}))

vi.mock('../../sales/SaleForm/SaleForm', () => ({
  default: ({ sale }: { sale: Sale }) => <div data-testid="sale-form">{sale?.id}</div>,
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeInsuranceSale = (id: string, overrides?: Partial<Sale>): Sale => ({
  id,
  clientId:       'c-1',
  clientName:     'Ana López',
  type:           SaleType.INSURANCE,
  title:          `Hogar - Ana ${id}`,
  insuranceBranch: 'Hogar',
  insuranceStage: InsuranceSaleStage.RESPONSE_PENDING,
  expectedRevenue: 1200,
  ownerUserName:  'Mila García',
  policyNumber:   `POL-${id}`,
  createdAt:      '2024-01-01T10:00:00Z',
  updatedAt:      '2024-01-01T10:00:00Z',
  ...overrides,
})

const ENERGY_SALE: Sale = {
  id: 'e1', clientId: 'c-2', clientName: 'Carlos Ruiz',
  type: SaleType.ENERGY, title: 'Luz - Carlos',
  energyStage: 'RESPONSE_PENDING' as Sale['energyStage'],
  createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Policies', () => {
  beforeEach(() => {
    mockSales = []
    mockLoading = false
    mockUpsertSale.mockReset()
    mockRemoveSale.mockReset()
  })

  it('renders the page title', () => {
    render(<Policies />)
    expect(screen.getByText('Pólizas')).toBeInTheDocument()
  })

  it('renders column headers', () => {
    mockSales = [makeInsuranceSale('1')]
    render(<Policies />)
    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(screen.getByText('Título / Ramo')).toBeInTheDocument()
    expect(screen.getByText('Etapa')).toBeInTheDocument()
    expect(screen.getByText('Ingreso esperado')).toBeInTheDocument()
    expect(screen.getByText('Nº póliza')).toBeInTheDocument()
  })

  it('shows empty state when no insurance sales exist', () => {
    render(<Policies />)
    expect(screen.getByText('No hay pólizas')).toBeInTheDocument()
  })

  it('renders only insurance sales, not energy sales', () => {
    mockSales = [makeInsuranceSale('1'), ENERGY_SALE]
    render(<Policies />)
    expect(screen.getByText('Hogar - Ana 1')).toBeInTheDocument()
    expect(screen.queryByText('Luz - Carlos')).not.toBeInTheDocument()
  })

  it('renders client name, policy number, revenue and stage', () => {
    mockSales = [makeInsuranceSale('1')]
    render(<Policies />)
    expect(screen.getByText('Ana López')).toBeInTheDocument()
    expect(screen.getByText('POL-1')).toBeInTheDocument()
    const revenueCells = document.querySelectorAll('.policies__revenue')
    const revenueTexts = Array.from(revenueCells).map(el => el.textContent ?? '')
    expect(revenueTexts.some(t => t.includes('1') && t.includes('200') && t.includes('€'))).toBe(true)
    expect(screen.getByText('Pte. respuesta')).toBeInTheDocument()
  })

  it('renders the search input', () => {
    render(<Policies />)
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('filters results by search query', async () => {
    mockSales = [
      makeInsuranceSale('1', { clientName: 'Ana López', title: 'Hogar - Ana' }),
      makeInsuranceSale('2', { clientName: 'Carlos Ruiz', title: 'Auto - Carlos' }),
    ]
    render(<Policies />)
    await userEvent.type(screen.getByRole('searchbox'), 'carlos')
    expect(screen.queryByText('Hogar - Ana')).not.toBeInTheDocument()
    expect(screen.getByText('Auto - Carlos')).toBeInTheDocument()
  })

  it('shows emptySearch when search has no matches', async () => {
    mockSales = [makeInsuranceSale('1')]
    render(<Policies />)
    await userEvent.type(screen.getByRole('searchbox'), 'zzznomatch')
    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
  })

  it('navigates to sale detail on row click', async () => {
    mockSales = [makeInsuranceSale('1')]
    render(<Policies />)
    await userEvent.click(screen.getByText('Hogar - Ana 1'))
    expect(screen.getByTestId('sale-detail')).toBeInTheDocument()
  })

  it('navigates to sale form on edit button click', async () => {
    mockSales = [makeInsuranceSale('1')]
    render(<Policies />)
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(screen.getByTestId('sale-form')).toBeInTheDocument()
  })
})
