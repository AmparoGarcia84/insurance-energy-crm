import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Trash2 } from 'lucide-react'
import InputField from '../FormField/InputField'
import SelectField from '../FormField/SelectField'
import TextareaField from '../FormField/TextareaField'
import { usePermissions } from '../../hooks/usePermissions'
import ConfirmModal from '../ConfirmModal/ConfirmModal'
import type { Sale, SaleInput } from '../../api/sales'
import { SaleType, InsuranceSaleStage, EnergySaleStage, createSale, updateSale, deleteSale } from '../../api/sales'
import './SaleForm.css'

interface Props {
  sale: Sale | null
  onSave: (saved: Sale) => void
  onCancel: () => void
  onDelete?: (id: string) => void
}

const INSURANCE_STAGES: InsuranceSaleStage[] = [
  InsuranceSaleStage.RESPONSE_PENDING,
  InsuranceSaleStage.DOCUMENTS_PENDING,
  InsuranceSaleStage.SIGNATURE_PENDING,
  InsuranceSaleStage.ISSUANCE_PENDING,
  InsuranceSaleStage.BILLING_THIS_MONTH,
  InsuranceSaleStage.BILLING_NEXT_MONTH,
  InsuranceSaleStage.RECURRENT_BILLING,
  InsuranceSaleStage.INVOICE_PENDING_PAYMENT,
  InsuranceSaleStage.WRONG_SETTLEMENT,
  InsuranceSaleStage.BILLED_AND_PAID,
  InsuranceSaleStage.CANCELED_UNPAID,
  InsuranceSaleStage.NOT_INSURABLE,
  InsuranceSaleStage.KO_SCORING,
  InsuranceSaleStage.LOST,
]

const ENERGY_STAGES: EnergySaleStage[] = [
  EnergySaleStage.RESPONSE_PENDING,
  EnergySaleStage.DOCUMENTS_PENDING,
  EnergySaleStage.SIGNATURE_PENDING,
  EnergySaleStage.ACTIVATION_PENDING,
  EnergySaleStage.BILLING_THIS_MONTH,
  EnergySaleStage.BILLED_AND_PAID,
  EnergySaleStage.LOST,
]

type FormState = {
  title: string
  type: SaleType
  insuranceBranch: string
  companyName: string
  saleKind: string
  insuranceStage: InsuranceSaleStage
  energyStage: EnergySaleStage
  expectedRevenue: string
  expectedSavingsPerYear: string
  nextStep: string
  description: string
  expectedCloseDate: string
}

const EMPTY: FormState = {
  title: '',
  type: SaleType.INSURANCE,
  insuranceBranch: '',
  companyName: '',
  saleKind: '',
  insuranceStage: InsuranceSaleStage.RESPONSE_PENDING,
  energyStage: EnergySaleStage.RESPONSE_PENDING,
  expectedRevenue: '',
  expectedSavingsPerYear: '',
  nextStep: '',
  description: '',
  expectedCloseDate: '',
}

function toFormState(sale: Sale): FormState {
  return {
    title: sale.title,
    type: sale.type,
    insuranceBranch: sale.insuranceBranch ?? '',
    companyName: sale.companyName ?? '',
    saleKind: sale.saleKind ?? '',
    insuranceStage: sale.insuranceStage ?? InsuranceSaleStage.RESPONSE_PENDING,
    energyStage: sale.energyStage ?? EnergySaleStage.RESPONSE_PENDING,
    expectedRevenue: sale.expectedRevenue != null ? String(sale.expectedRevenue) : '',
    expectedSavingsPerYear: sale.expectedSavingsPerYear != null ? String(sale.expectedSavingsPerYear) : '',
    nextStep: sale.nextStep ?? '',
    description: sale.description ?? '',
    expectedCloseDate: sale.expectedCloseDate ?? '',
  }
}

function toInput(form: FormState, clientId: string): SaleInput {
  const isInsurance = form.type === SaleType.INSURANCE
  return {
    clientId,
    type: form.type,
    title: form.title,
    insuranceBranch: isInsurance ? form.insuranceBranch || undefined : undefined,
    companyName: form.companyName || undefined,
    saleKind: form.saleKind || undefined,
    insuranceStage: isInsurance ? form.insuranceStage : undefined,
    energyStage: !isInsurance ? form.energyStage : undefined,
    expectedRevenue: isInsurance && form.expectedRevenue ? Number(form.expectedRevenue) : undefined,
    expectedSavingsPerYear: !isInsurance && form.expectedSavingsPerYear ? Number(form.expectedSavingsPerYear) : undefined,
    nextStep: form.nextStep || undefined,
    description: form.description || undefined,
    expectedCloseDate: form.expectedCloseDate || undefined,
  }
}

export default function SaleForm({ sale, onSave, onCancel, onDelete }: Props) {
  const { t } = useTranslation()
  const { canDelete } = usePermissions()
  const isNew = sale === null

  const [form, setForm] = useState<FormState>(() => sale ? toFormState(sale) : EMPTY)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const input = toInput(form, sale?.clientId ?? '')
      const saved = isNew
        ? await createSale(input)
        : await updateSale(sale.id, input)
      onSave(saved)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!sale) return
    await deleteSale(sale.id)
    onDelete?.(sale.id)
  }

  const isInsurance = form.type === SaleType.INSURANCE

  return (
    <>
      <div className="sale-form-header">
        <button type="button" className="icon-btn sale-form-back" onClick={onCancel}>
          <ChevronLeft size={18} />
          {t('sales.backToBoard')}
        </button>
        {!isNew && canDelete && (
          <button type="button" className="icon-btn icon-btn-danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <form className="sale-form" onSubmit={handleSave}>
        <h2 className="sale-form__title">{isNew ? t('sales.new') : t('sales.edit')}</h2>

        <section className="form-section">
          <h3 className="form-section-title">{t('sales.sections.opportunity')}</h3>
          <div className="form-grid">
            <InputField
              id="sale-title"
              label={t('sales.fields.title')}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              required
              className="col-span-2"
            />

            <div className="form-field sale-form__type-toggle">
              <label>{t('sales.fields.type')}</label>
              <div className="sale-form__toggle-group">
                <button
                  type="button"
                  className={form.type === SaleType.INSURANCE ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => set('type', SaleType.INSURANCE)}
                >
                  {t('sales.toggleInsurance')}
                </button>
                <button
                  type="button"
                  className={form.type === SaleType.ENERGY ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => set('type', SaleType.ENERGY)}
                >
                  {t('sales.toggleEnergy')}
                </button>
              </div>
            </div>

            <InputField
              id="sale-company"
              label={t('sales.fields.company')}
              value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)}
            />
          </div>
        </section>

        <section className="form-section">
          <h3 className="form-section-title">{t('sales.sections.pipeline')}</h3>
          <div className="form-grid">
            {isInsurance ? (
              <>
                <InputField
                  id="sale-branch"
                  label={t('sales.fields.branch')}
                  value={form.insuranceBranch}
                  onChange={(e) => set('insuranceBranch', e.target.value)}
                  placeholder="Vida, Hogar, RC, Auto..."
                />
                <SelectField
                  id="sale-insurance-stage"
                  label={t('sales.fields.stage')}
                  value={form.insuranceStage}
                  onChange={(e) => set('insuranceStage', e.target.value as InsuranceSaleStage)}
                >
                  {INSURANCE_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {t(`sales.stages.insurance.${s}`)}
                    </option>
                  ))}
                </SelectField>
                <InputField
                  id="sale-revenue"
                  label={t('sales.fields.expectedRevenue')}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.expectedRevenue}
                  onChange={(e) => set('expectedRevenue', e.target.value)}
                />
              </>
            ) : (
              <>
                <SelectField
                  id="sale-energy-stage"
                  label={t('sales.fields.stage')}
                  value={form.energyStage}
                  onChange={(e) => set('energyStage', e.target.value as EnergySaleStage)}
                >
                  {ENERGY_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {t(`sales.stages.energy.${s}`)}
                    </option>
                  ))}
                </SelectField>
                <InputField
                  id="sale-savings"
                  label={t('sales.fields.expectedSavings')}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.expectedSavingsPerYear}
                  onChange={(e) => set('expectedSavingsPerYear', e.target.value)}
                />
              </>
            )}
            <InputField
              id="sale-close-date"
              label={t('sales.fields.expectedCloseDate')}
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) => set('expectedCloseDate', e.target.value)}
            />
          </div>
        </section>

        <section className="form-section">
          <h3 className="form-section-title">{t('sales.sections.actions')}</h3>
          <div className="form-grid">
            <InputField
              id="sale-next-step"
              label={t('sales.fields.nextStep')}
              value={form.nextStep}
              onChange={(e) => set('nextStep', e.target.value)}
              className="col-span-2"
            />
            <TextareaField
              id="sale-description"
              label={t('sales.fields.description')}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="col-span-2"
            />
          </div>
        </section>

        <div className="sale-form__actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn-primary" disabled={saving || !form.title.trim()}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>

      {confirmDelete && (
        <ConfirmModal
          title={t('sales.deleteConfirm')}
          message=""
          onClose={() => setConfirmDelete(false)}
          actions={[
            { label: t('common.cancel'), onClick: () => setConfirmDelete(false), variant: 'secondary' },
            { label: t('sales.actions.delete'), onClick: handleDelete, variant: 'primary' },
          ]}
        />
      )}
    </>
  )
}
