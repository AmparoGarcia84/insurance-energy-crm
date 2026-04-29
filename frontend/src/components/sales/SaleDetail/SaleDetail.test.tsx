import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import SaleDetail from './SaleDetail'
import type { Sale } from '../../../api/sales'
import { SaleType, InsuranceSaleStage, EnergySaleStage } from '../../../api/sales'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'es' },
  }),
}))

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-owner', role: 'OWNER', displayName: 'Mila' } }),
}))

vi.mock('../../../hooks/usePermissions', () => ({
  usePermissions: () => ({ canDelete: true }),
}))

vi.mock('../../../api/activities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/activities')>()
  return { ...actual, getActivities: vi.fn().mockResolvedValue([]) }
})

vi.mock('../../../api/tasks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/tasks')>()
  return { ...actual, getTasks: vi.fn().mockResolvedValue([]) }
})

vi.mock('../../../api/documents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/documents')>()
  return { ...actual, getDocuments: vi.fn().mockResolvedValue([]) }
})

const mockClient = {
  id: 'client-001',
  name: 'Ana Martínez López',
  clientNumber: '10001',
  mobilePhone: '+34 612 345 678',
  emails: [{ id: 'e1', address: 'ana.martinez@email.com', isPrimary: true }],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

vi.mock('../../../context/DataContext', () => ({
  useClients: () => ({ clients: [mockClient], loading: false }),
  useCases:   () => ({ cases: [], loading: false, upsertCase: vi.fn(), removeCase: vi.fn() }),
  useSales:   () => ({ sales: [], loading: false }),
}))

const baseSale: Sale = {
  id: 'sale-001',
  type: SaleType.INSURANCE,
  title: 'Seguro Hogar - Ana Martínez',
  clientId: 'client-001',
  clientName: 'Ana Martínez López',
  insuranceStage: InsuranceSaleStage.DOCUMENTS_PENDING,
  insuranceBranch: 'Hogar',
  expectedRevenue: 1200,
  probabilityPercent: 75,
  expectedCloseDate: '2024-06-15',
  issueDate: '2024-06-01',
  billingDate: '2024-06-15',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const energySale: Sale = {
  id: 'sale-002',
  type: SaleType.ENERGY,
  title: 'Contrato Energía - Juan López',
  clientId: 'client-002',
  clientName: 'Juan López',
  energyStage: EnergySaleStage.DOCUMENTS_PENDING,
  expectedSavingsPerYear: 800,
  probabilityPercent: 50,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

function renderDetail(sale = baseSale, props?: Partial<Parameters<typeof SaleDetail>[0]>) {
  return render(
    <MemoryRouter>
      <SaleDetail
        sale={sale}
        onBack={vi.fn()}
        onEdit={vi.fn()}
        {...props}
      />
    </MemoryRouter>
  )
}

describe('SaleDetail', () => {
  const onBack = vi.fn()
  const onEdit = vi.fn()
  const onViewClient = vi.fn()

  beforeEach(() => {
    onBack.mockClear()
    onEdit.mockClear()
    onViewClient.mockClear()
  })

  it('renders sale title in header', () => {
    renderDetail()
    expect(screen.getByRole('heading', { name: 'Seguro Hogar - Ana Martínez' })).toBeInTheDocument()
  })

  it('renders client name in header meta', () => {
    renderDetail()
    expect(screen.getAllByText('Ana Martínez López').length).toBeGreaterThanOrEqual(1)
  })

  it('renders stage badge for insurance sale', () => {
    renderDetail()
    expect(screen.getByText('sales.stages.insurance.DOCUMENTS_PENDING')).toBeInTheDocument()
  })

  it('renders stage badge for energy sale', () => {
    renderDetail(energySale)
    expect(screen.getByText('sales.stages.energy.DOCUMENTS_PENDING')).toBeInTheDocument()
  })

  it('renders branch badge for insurance sale', () => {
    renderDetail()
    expect(screen.getAllByText('Hogar').length).toBeGreaterThanOrEqual(1)
  })

  it('calls onBack when back button is clicked', () => {
    renderDetail(baseSale, { onBack })
    fireEvent.click(screen.getByTitle('sales.detail.back'))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('calls onEdit with sale when edit button is clicked', () => {
    renderDetail(baseSale, { onEdit })
    fireEvent.click(screen.getByText('sales.detail.edit'))
    expect(onEdit).toHaveBeenCalledWith(baseSale)
  })

  it('renders all five tabs', () => {
    renderDetail()
    expect(screen.getByText('sales.detail.tabs.information')).toBeInTheDocument()
    expect(screen.getByText('sales.detail.tabs.activity')).toBeInTheDocument()
    expect(screen.getByText('sales.detail.tabs.tasks')).toBeInTheDocument()
    expect(screen.getByText('sales.detail.tabs.cases')).toBeInTheDocument()
    expect(screen.getByText('sales.detail.tabs.documents')).toBeInTheDocument()
  })

  it('activity tab renders the new activity button', async () => {
    renderDetail()
    fireEvent.click(screen.getByText('sales.detail.tabs.activity'))
    await waitFor(() => {
      expect(screen.getByText('activities.newActivity')).toBeInTheDocument()
    })
  })

  it('tasks tab renders the new task button', async () => {
    renderDetail()
    fireEvent.click(screen.getByText('sales.detail.tabs.tasks'))
    await waitFor(() => {
      expect(screen.getByText('tasks.newTask')).toBeInTheDocument()
    })
  })

  it('documents tab renders the add document button', async () => {
    renderDetail()
    fireEvent.click(screen.getByText('sales.detail.tabs.documents'))
    await waitFor(() => {
      expect(screen.getByText('documents.actions.add')).toBeInTheDocument()
    })
  })

  it('shows info card in information tab', () => {
    renderDetail()
    expect(screen.getByText('sales.sections.saleInfo')).toBeInTheDocument()
  })

  it('shows owner in info card when set', () => {
    const sale: Sale = { ...baseSale, ownerUserName: 'Mila García' }
    renderDetail(sale)
    expect(screen.getByText('Mila García')).toBeInTheDocument()
    expect(screen.getByText('sales.fields.owner')).toBeInTheDocument()
  })

  it('omits field row when value is empty', () => {
    renderDetail()
    expect(screen.queryByText('sales.fields.contactName')).not.toBeInTheDocument()
    expect(screen.queryByText('sales.fields.channel')).not.toBeInTheDocument()
  })

  it('shows description full-width in info card', () => {
    const sale: Sale = { ...baseSale, description: 'Cliente muy importante' }
    renderDetail(sale)
    expect(screen.getByText('Cliente muy importante')).toBeInTheDocument()
    expect(screen.getByText('sales.fields.description')).toBeInTheDocument()
  })

  it('shows lostReason in info card when set', () => {
    const sale: Sale = { ...baseSale, lostReason: 'Precio elevado' }
    renderDetail(sale)
    expect(screen.getByText('Precio elevado')).toBeInTheDocument()
    expect(screen.getByText('sales.fields.lostReason')).toBeInTheDocument()
  })

  it('shows translated businessType in info card', () => {
    const sale: Sale = { ...baseSale, businessType: 'NEW_BUSINESS' as Sale['businessType'] }
    renderDetail(sale)
    expect(screen.getByText('sales.businessType.NEW_BUSINESS')).toBeInTheDocument()
  })

  it('shows energy savings in info card for energy sale', () => {
    renderDetail(energySale)
    expect(screen.getByText('sales.fields.expectedSavings')).toBeInTheDocument()
  })

  it('info card not shown when switching to activity tab', async () => {
    renderDetail()
    fireEvent.click(screen.getByText('sales.detail.tabs.activity'))
    await waitFor(() => {
      expect(screen.queryByText('sales.sections.saleInfo')).not.toBeInTheDocument()
    })
  })

  it('renders expected revenue in value card', () => {
    renderDetail()
    expect(screen.getByText('sales.detail.cards.expectedRevenue')).toBeInTheDocument()
    expect(screen.getAllByText(/1[.,]?200/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders probability bar for insurance sale', () => {
    renderDetail()
    expect(screen.getAllByText(/75%/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders energy savings with /año unit', () => {
    renderDetail(energySale)
    expect(screen.getAllByText(/800/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('/año')).toBeInTheDocument()
  })

  it('renders key dates in dates card', () => {
    renderDetail()
    expect(screen.getByText('sales.fields.expectedCloseDate')).toBeInTheDocument()
    expect(screen.getByText('sales.fields.issueDate')).toBeInTheDocument()
    expect(screen.getByText('sales.fields.billingDate')).toBeInTheDocument()
  })

  it('renders em-dash when dates are missing', () => {
    const saleNoDates: Sale = { ...baseSale, expectedCloseDate: undefined, issueDate: undefined, billingDate: undefined }
    renderDetail(saleNoDates)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(3)
  })

  it('renders view client button when onViewClient is provided', () => {
    renderDetail(baseSale, { onViewClient })
    const btn = screen.getByText('sales.detail.cards.viewClient')
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(onViewClient).toHaveBeenCalledWith('client-001')
  })

  it('renders view client button even without onViewClient', () => {
    renderDetail()
    expect(screen.getByText('sales.detail.cards.viewClient')).toBeInTheDocument()
  })

  it('renders client number from context', () => {
    renderDetail()
    expect(screen.getByText(/10001/)).toBeInTheDocument()
  })

  it('renders phone from context', () => {
    renderDetail()
    expect(screen.getByText('+34 612 345 678')).toBeInTheDocument()
  })

  it('renders primary email from context', () => {
    renderDetail()
    expect(screen.getByText('ana.martinez@email.com')).toBeInTheDocument()
  })

  it('does not render branch badge for energy sale', () => {
    renderDetail(energySale)
    expect(screen.queryByText('Hogar')).not.toBeInTheDocument()
  })
})
