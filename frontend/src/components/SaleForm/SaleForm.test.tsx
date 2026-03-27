import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SaleForm from './SaleForm'
import { SaleType, InsuranceSaleStage } from '../../api/sales'
import type { Sale } from '../../api/sales'

vi.mock('../../api/sales', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/sales')>()
  return {
    ...actual,
    createSale: vi.fn().mockResolvedValue({
      id: 'new-1',
      clientId: '',
      type: 'INSURANCE',
      title: 'Test Sale',
      insuranceBranch: 'Vida',
      insuranceStage: 'RESPONSE_PENDING',
      createdAt: '',
      updatedAt: '',
    }),
    updateSale: vi.fn().mockResolvedValue({
      id: '1',
      clientId: 'c1',
      type: 'INSURANCE',
      title: 'Updated Sale',
      insuranceBranch: 'Hogar',
      insuranceStage: 'DOCUMENTS_PENDING',
      createdAt: '',
      updatedAt: '',
    }),
    deleteSale: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({ canDelete: true, canEdit: true, canCreate: true }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'sales.new': 'Nueva venta',
        'sales.edit': 'Editar venta',
        'sales.backToBoard': 'Volver al tablero',
        'sales.toggleInsurance': 'Seguros',
        'sales.toggleEnergy': 'Energía',
        'sales.fields.title': 'Cliente / Descripción',
        'sales.fields.type': 'Tipo',
        'sales.fields.company': 'Compañía',
        'sales.fields.branch': 'Ramo',
        'sales.fields.stage': 'Etapa',
        'sales.fields.expectedRevenue': 'Prima anual (€)',
        'sales.fields.expectedSavings': 'Ahorro anual (€)',
        'sales.fields.nextStep': 'Próxima acción',
        'sales.fields.description': 'Descripción',
        'sales.fields.expectedCloseDate': 'Fecha de cierre',
        'sales.sections.opportunity': 'Oportunidad',
        'sales.sections.pipeline': 'Pipeline',
        'sales.sections.actions': 'Acciones',
        'sales.deleteConfirm': '¿Eliminar esta oportunidad?',
        'sales.actions.delete': 'Eliminar',
        'common.cancel': 'Cancelar',
        'common.save': 'Guardar',
        'common.saving': 'Guardando...',
      }
      return map[key] ?? key
    },
  }),
}))

const EXISTING_SALE: Sale = {
  id: '1',
  clientId: 'c1',
  type: SaleType.INSURANCE,
  title: 'Pedro Gómez',
  insuranceBranch: 'Vida',
  expectedRevenue: 2100,
  insuranceStage: InsuranceSaleStage.RESPONSE_PENDING,
  nextStep: 'Llamar',
  createdAt: '',
  updatedAt: '',
}

describe('SaleForm', () => {
  const onSave = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => {
    onSave.mockReset()
    onCancel.mockReset()
  })

  it('renders new sale form with empty title', () => {
    render(<SaleForm sale={null} onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('Nueva venta')).toBeInTheDocument()
    expect(screen.getByLabelText('Cliente / Descripción')).toHaveValue('')
  })

  it('renders edit form with existing values', () => {
    render(<SaleForm sale={EXISTING_SALE} onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('Editar venta')).toBeInTheDocument()
    expect(screen.getByLabelText('Cliente / Descripción')).toHaveValue('Pedro Gómez')
  })

  it('calls onCancel when back button is clicked', async () => {
    render(<SaleForm sale={null} onSave={onSave} onCancel={onCancel} />)
    await userEvent.click(screen.getByText('Volver al tablero'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('disables save button when title is empty', () => {
    render(<SaleForm sale={null} onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('Guardar')).toBeDisabled()
  })

  it('calls onSave after successful create', async () => {
    render(<SaleForm sale={null} onSave={onSave} onCancel={onCancel} />)
    await userEvent.type(screen.getByLabelText('Cliente / Descripción'), 'Test Sale')
    await userEvent.click(screen.getByText('Guardar'))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
  })
})
