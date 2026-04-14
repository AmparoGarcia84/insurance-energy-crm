import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Sales from './Sales'
import { SaleType, InsuranceSaleStage, EnergySaleStage } from '../../api/sales'
import type { Sale } from '../../api/sales'

const MOCK_SALES: Sale[] = [
  { id: '1', clientId: 'c1', clientName: 'Pedro Gómez',  type: SaleType.INSURANCE, title: 'Vida - Pedro Gómez',       insuranceBranch: 'Vida',   expectedRevenue: 2100, insuranceStage: InsuranceSaleStage.RESPONSE_PENDING,  createdAt: '', updatedAt: '' },
  { id: '2', clientId: 'c2', clientName: 'Ana Martínez', type: SaleType.INSURANCE, title: 'Hogar - Ana Martínez',     insuranceBranch: 'Hogar',  expectedRevenue: 1200, insuranceStage: InsuranceSaleStage.DOCUMENTS_PENDING, createdAt: '', updatedAt: '' },
  { id: '3', clientId: 'c3', clientName: 'Bar La Terraza', type: SaleType.ENERGY,  title: 'Gas + Luz - Bar La Terraza', companyName: 'Endesa', expectedSavingsPerYear: 1800, energyStage: EnergySaleStage.ACTIVATION_PENDING,   createdAt: '', updatedAt: '' },
]

vi.mock('../../context/DataContext', () => ({
  useSales: () => ({
    sales: MOCK_SALES,
    loading: false,
    upsertSale: vi.fn(),
    removeSale: vi.fn(),
  }),
  useClients: () => ({
    clients: [
      { id: 'c1', name: 'Pedro Gómez', clientNumber: '000001', nif: '12345678A' },
      { id: 'c2', name: 'Ana Martínez', clientNumber: '000002', nif: 'B12345678' },
    ],
    loading: false,
  }),
}))

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { displayName: 'Mila García', role: 'OWNER' } }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'sales.title': 'Pipeline de Oportunidades',
        'sales.subtitle': 'Gestión visual del embudo de ventas',
        'sales.new': 'Nueva venta',
        'sales.toggleInsurance': 'Seguros',
        'sales.toggleEnergy': 'Energía',
        'sales.card.savingsPerYear': '/año ahorro',
        'sales.stages.insurance.RESPONSE_PENDING': 'Pte. respuesta',
        'sales.stages.insurance.DOCUMENTS_PENDING': 'Pte. documentación',
        'sales.stages.energy.RESPONSE_PENDING': 'Pte. respuesta',
      }
      if (key === 'sales.opportunitiesCount') return `${opts?.count} oportunidades`
      return map[key] ?? key
    },
  }),
}))

describe('Sales', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the pipeline title', () => {
    render(<Sales />)
    expect(screen.getByText('Pipeline de Oportunidades')).toBeInTheDocument()
  })

  it('renders insurance columns by default', () => {
    render(<Sales />)
    expect(screen.getByText('Pte. respuesta')).toBeInTheDocument()
    expect(screen.getByText('Pte. documentación')).toBeInTheDocument()
  })

  it('renders demo sales cards', () => {
    render(<Sales />)
    expect(screen.getByText('Pedro Gómez')).toBeInTheDocument()
    expect(screen.getByText('Ana Martínez')).toBeInTheDocument()
  })

  it('switches to energy view when toggle is clicked', async () => {
    render(<Sales />)
    await userEvent.click(screen.getByText('Energía'))
    // Energy demo cards should appear
    expect(screen.getByText('Bar La Terraza')).toBeInTheDocument()
  })

  it('shows SaleForm when Nueva venta is clicked', async () => {
    render(<Sales />)
    await userEvent.click(screen.getByText('Nueva venta'))
    expect(screen.getByText('Nueva venta', { selector: 'h2' })).toBeInTheDocument()
  })
})
