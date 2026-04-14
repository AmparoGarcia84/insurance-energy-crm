import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SaleCard from './SaleCard'
import { SaleType, InsuranceSaleStage } from '../../api/sales'
import type { Sale } from '../../api/sales'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'sales.card.savingsPerYear': '/año ahorro',
      }
      return map[key] ?? key
    },
  }),
}))

const INSURANCE_SALE: Sale = {
  id: '1',
  clientId: 'c1',
  clientName: 'Pedro Gómez',
  type: SaleType.INSURANCE,
  title: 'Vida - Pedro Gómez',
  insuranceBranch: 'Vida',
  expectedRevenue: 2100,
  insuranceStage: InsuranceSaleStage.RESPONSE_PENDING,
  nextStep: 'Seguimiento llamada',
  createdAt: '',
  updatedAt: '',
}

describe('SaleCard', () => {
  it('renders client name as primary identifier', () => {
    render(<SaleCard sale={INSURANCE_SALE} onClick={vi.fn()} />)
    expect(screen.getByText('Pedro Gómez')).toBeInTheDocument()
  })

  it('renders sale title as subtitle when clientName is set', () => {
    render(<SaleCard sale={INSURANCE_SALE} onClick={vi.fn()} />)
    expect(screen.getByText('Vida - Pedro Gómez')).toBeInTheDocument()
  })

  it('renders title as fallback when clientName is absent', () => {
    const sale: Sale = { ...INSURANCE_SALE, clientName: undefined }
    render(<SaleCard sale={sale} onClick={vi.fn()} />)
    expect(screen.getByText('Vida - Pedro Gómez')).toBeInTheDocument()
  })

  it('renders insurance branch badge', () => {
    render(<SaleCard sale={INSURANCE_SALE} onClick={vi.fn()} />)
    expect(screen.getByText('Vida')).toBeInTheDocument()
  })

  it('renders revenue', () => {
    render(<SaleCard sale={INSURANCE_SALE} onClick={vi.fn()} />)
    const revenueSpan = document.querySelector('.sale-card__revenue-value')
    expect(revenueSpan?.textContent).toMatch(/2[.,]?100/)
  })

  it('renders next step', () => {
    render(<SaleCard sale={INSURANCE_SALE} onClick={vi.fn()} />)
    expect(screen.getByText('Seguimiento llamada')).toBeInTheDocument()
  })

  it('renders owner initials from ownerUserName on sale', () => {
    const sale: Sale = { ...INSURANCE_SALE, ownerUserName: 'Mila García' }
    render(<SaleCard sale={sale} onClick={vi.fn()} />)
    expect(screen.getByTitle('Mila García')).toHaveTextContent('MG')
  })

  it('falls back to ownerName prop when ownerUserName not set', () => {
    render(<SaleCard sale={INSURANCE_SALE} ownerName="Mila García" onClick={vi.fn()} />)
    expect(screen.getByTitle('Mila García')).toHaveTextContent('MG')
  })

  it('calls onClick when clicked', async () => {
    const onClickMock = vi.fn()
    render(<SaleCard sale={INSURANCE_SALE} onClick={onClickMock} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClickMock).toHaveBeenCalledWith(INSURANCE_SALE)
  })

  it('renders savings for energy sales', () => {
    const energySale: Sale = {
      ...INSURANCE_SALE,
      id: '2',
      clientName: 'Bar La Terraza',
      type: SaleType.ENERGY,
      title: 'Luz - Bar La Terraza',
      insuranceBranch: undefined,
      companyName: 'Iberdrola',
      expectedRevenue: undefined,
      expectedSavingsPerYear: 3200,
      insuranceStage: undefined,
    }
    render(<SaleCard sale={energySale} onClick={vi.fn()} />)
    const revenueSpan = document.querySelector('.sale-card__revenue-value')
    expect(revenueSpan?.textContent).toMatch(/3[.,]?200/)
    expect(revenueSpan?.textContent).toContain('/año ahorro')
    expect(screen.getByText('Iberdrola')).toBeInTheDocument()
  })
})
