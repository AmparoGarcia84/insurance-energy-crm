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
      title: 'Vida - Test',
      insuranceBranch: 'Vida',
      insuranceStage: 'RESPONSE_PENDING',
      createdAt: '',
      updatedAt: '',
    }),
    updateSale: vi.fn().mockResolvedValue({
      id: '1',
      clientId: 'c1',
      type: 'INSURANCE',
      title: 'Hogar - Pedro Gómez',
      clientName: 'Pedro Gómez',
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
        'sales.fields.type': 'Tipo',
        'sales.fields.title': 'Nombre de Venta',
        'sales.fields.clientName': 'Nombre de Cliente',
        'sales.fields.owner': 'Propietario de Venta',
        'sales.fields.amount': 'Importe',
        'sales.fields.company': 'Compañía',
        'sales.fields.branch': 'Ramo',
        'sales.fields.stage': 'Fase',
        'sales.fields.expectedRevenue': 'Ingresos esperados',
        'sales.fields.expectedSavings': 'Ahorro anual estimado (€)',
        'sales.fields.nextStep': 'Siguiente paso',
        'sales.fields.description': 'Descripción',
        'sales.fields.expectedCloseDate': 'Fecha de cierre',
        'sales.fields.issueDate': 'Fecha de emisión / act.',
        'sales.fields.billingDate': 'Fecha de cobro',
        'sales.fields.channel': 'Canal',
        'sales.fields.probabilityPercent': 'Probabilidad (%)',
        'sales.fields.projectSource': 'Fuente de Proyecto',
        'sales.fields.contactName': 'Nombre de Contacto',
        'sales.fields.campaignSource': 'Fuente de Campaña',
        'sales.fields.forecastCategory': 'Categoría de la previsión',
        'sales.fields.policyNumber': 'Nº de póliza',
        'sales.fields.contractId': 'ID Contrato',
        'sales.fields.socialLeadId': 'Social Lead ID',
        'sales.sections.saleInfo': 'Información de Venta',
        'sales.sections.description': 'Información de la descripción',
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
  clientName: 'Pedro Gómez',
  type: SaleType.INSURANCE,
  title: 'Vida - Pedro Gómez',
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
    expect(screen.getByLabelText('Nombre de Venta')).toHaveValue('')
  })

  it('renders edit form with existing values', () => {
    render(<SaleForm sale={EXISTING_SALE} onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText('Editar venta')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre de Venta')).toHaveValue('Vida - Pedro Gómez')
    expect(screen.getByLabelText('Nombre de Cliente')).toHaveValue('Pedro Gómez')
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
    await userEvent.type(screen.getByLabelText('Nombre de Venta'), 'Vida - Test')
    await userEvent.click(screen.getByText('Guardar'))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
  })
})
