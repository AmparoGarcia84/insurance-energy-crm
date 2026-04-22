import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Energy from './Energy'
import { SaleType, EnergySaleStage } from '../../../api/sales'
import type { Sale } from '../../../api/sales'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'energy.title':                            'Energía',
        'energy.search':                           'Buscar...',
        'energy.empty':                            'No hay contratos de energía',
        'energy.emptySearch':                      'Sin resultados',
        'energy.columns.client':                   'Cliente',
        'energy.columns.title':                    'Título',
        'energy.columns.stage':                    'Etapa',
        'energy.columns.revenue':                  'Ingreso esperado',
        'energy.columns.contractId':               'ID contrato',
        'energy.columns.owner':                    'Responsable',
        'sales.edit':                              'Editar',
        'sales.stages.energy.RESPONSE_PENDING':    'Pte. respuesta',
        'sales.stages.energy.BILLED_AND_PAID':     'Cobrado y facturado',
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

const makeEnergySale = (id: string, overrides?: Partial<Sale>): Sale => ({
  id,
  clientId:       'c-1',
  clientName:     'Ana López',
  type:           SaleType.ENERGY,
  title:          `Luz - Ana ${id}`,
  energyStage:    EnergySaleStage.RESPONSE_PENDING,
  expectedRevenue: 800,
  ownerUserName:  'Mila García',
  contractId:     `CTR-${id}`,
  createdAt:      '2024-01-01T10:00:00Z',
  updatedAt:      '2024-01-01T10:00:00Z',
  ...overrides,
})

const INSURANCE_SALE: Sale = {
  id: 'i1', clientId: 'c-2', clientName: 'Carlos Ruiz',
  type: SaleType.INSURANCE, title: 'Hogar - Carlos',
  insuranceStage: 'RESPONSE_PENDING' as Sale['insuranceStage'],
  createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Energy', () => {
  beforeEach(() => {
    mockSales = []
    mockLoading = false
    mockUpsertSale.mockReset()
    mockRemoveSale.mockReset()
  })

  it('renders the page title', () => {
    render(<Energy />)
    expect(screen.getByText('Energía')).toBeInTheDocument()
  })

  it('renders column headers', () => {
    mockSales = [makeEnergySale('1')]
    render(<Energy />)
    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(screen.getByText('Título')).toBeInTheDocument()
    expect(screen.getByText('Etapa')).toBeInTheDocument()
    expect(screen.getByText('Ingreso esperado')).toBeInTheDocument()
    expect(screen.getByText('ID contrato')).toBeInTheDocument()
  })

  it('shows empty state when no energy sales exist', () => {
    render(<Energy />)
    expect(screen.getByText('No hay contratos de energía')).toBeInTheDocument()
  })

  it('renders only energy sales, not insurance sales', () => {
    mockSales = [makeEnergySale('1'), INSURANCE_SALE]
    render(<Energy />)
    expect(screen.getByText('Luz - Ana 1')).toBeInTheDocument()
    expect(screen.queryByText('Hogar - Carlos')).not.toBeInTheDocument()
  })

  it('renders client name, contract id, revenue and stage', () => {
    mockSales = [makeEnergySale('1')]
    render(<Energy />)
    expect(screen.getByText('Ana López')).toBeInTheDocument()
    expect(screen.getByText('CTR-1')).toBeInTheDocument()
    const revenueCells = document.querySelectorAll('.energy__revenue')
    const revenueTexts = Array.from(revenueCells).map(el => el.textContent ?? '')
    expect(revenueTexts.some(t => t.includes('800') && t.includes('€'))).toBe(true)
    expect(screen.getByText('Pte. respuesta')).toBeInTheDocument()
  })

  it('renders the search input', () => {
    render(<Energy />)
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('filters results by search query', async () => {
    mockSales = [
      makeEnergySale('1', { clientName: 'Ana López',   title: 'Luz - Ana' }),
      makeEnergySale('2', { clientName: 'Carlos Ruiz', title: 'Gas - Carlos' }),
    ]
    render(<Energy />)
    await userEvent.type(screen.getByRole('searchbox'), 'carlos')
    expect(screen.queryByText('Luz - Ana')).not.toBeInTheDocument()
    expect(screen.getByText('Gas - Carlos')).toBeInTheDocument()
  })

  it('shows emptySearch when search has no matches', async () => {
    mockSales = [makeEnergySale('1')]
    render(<Energy />)
    await userEvent.type(screen.getByRole('searchbox'), 'zzznomatch')
    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
  })

  it('navigates to sale detail on row click', async () => {
    mockSales = [makeEnergySale('1')]
    render(<Energy />)
    await userEvent.click(screen.getByText('Luz - Ana 1'))
    expect(screen.getByTestId('sale-detail')).toBeInTheDocument()
  })

  it('navigates to sale form on edit button click', async () => {
    mockSales = [makeEnergySale('1')]
    render(<Energy />)
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(screen.getByTestId('sale-form')).toBeInTheDocument()
  })
})
