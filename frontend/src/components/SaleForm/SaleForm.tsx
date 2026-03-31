import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Trash2 } from 'lucide-react'
import InputField from '../FormField/InputField'
import SelectField from '../FormField/SelectField'
import TextareaField from '../FormField/TextareaField'
import { usePermissions } from '../../hooks/usePermissions'
import ConfirmModal from '../ConfirmModal/ConfirmModal'
import type { Sale, SaleInput } from '../../api/sales'
import {
  SaleType,
  SaleBusinessType,
  SaleProjectSource,
  SaleForecastCategory,
  InsuranceSaleStage,
  EnergySaleStage,
  INSURANCE_STAGES,
  ENERGY_STAGES,
  createSale,
  updateSale,
  deleteSale,
} from '../../api/sales'
import './SaleForm.css'

interface Props {
  sale: Sale | null
  onSave: (saved: Sale) => void
  onCancel: () => void
  onDelete?: (id: string) => void
}


const BUSINESS_TYPES: SaleBusinessType[] = [
  SaleBusinessType.NEW_BUSINESS,
  SaleBusinessType.EXISTING_BUSINESS,
]

const PROJECT_SOURCES: SaleProjectSource[] = Object.values(SaleProjectSource)

const FORECAST_CATEGORIES: SaleForecastCategory[] = Object.values(SaleForecastCategory)

type FormState = {
  type: SaleType
  title: string
  clientId: string
  clientName: string
  ownerUserName: string
  ownerUserId: string
  companyName: string
  insuranceBranch: string
  businessType: SaleBusinessType | ''
  amount: string
  expectedRevenue: string
  expectedSavingsPerYear: string
  insuranceStage: InsuranceSaleStage
  energyStage: EnergySaleStage
  expectedCloseDate: string
  issueDate: string
  billingDate: string
  channel: string
  probabilityPercent: string
  projectSource: SaleProjectSource | ''
  contactName: string
  campaignSource: string
  forecastCategory: SaleForecastCategory | ''
  policyNumber: string
  contractId: string
  socialLeadId: string
  nextStep: string
  description: string
}

const EMPTY: FormState = {
  type: SaleType.INSURANCE,
  title: '',
  clientId: '',
  clientName: '',
  ownerUserName: '',
  ownerUserId: '',
  companyName: '',
  insuranceBranch: '',
  businessType: '',
  amount: '',
  expectedRevenue: '',
  expectedSavingsPerYear: '',
  insuranceStage: InsuranceSaleStage.RESPONSE_PENDING,
  energyStage: EnergySaleStage.RESPONSE_PENDING,
  expectedCloseDate: '',
  issueDate: '',
  billingDate: '',
  channel: '',
  probabilityPercent: '10',
  projectSource: '',
  contactName: '',
  campaignSource: '',
  forecastCategory: '',
  policyNumber: '',
  contractId: '',
  socialLeadId: '',
  nextStep: '',
  description: '',
}

function toFormState(sale: Sale): FormState {
  return {
    type: sale.type,
    title: sale.title,
    clientId: sale.clientId,
    clientName: sale.clientName ?? '',
    ownerUserName: sale.ownerUserName ?? '',
    ownerUserId: sale.ownerUserId ?? '',
    companyName: sale.companyName ?? '',
    insuranceBranch: sale.insuranceBranch ?? '',
    businessType: sale.businessType ?? '',
    amount: sale.amount != null ? String(sale.amount) : '',
    expectedRevenue: sale.expectedRevenue != null ? String(sale.expectedRevenue) : '',
    expectedSavingsPerYear: sale.expectedSavingsPerYear != null ? String(sale.expectedSavingsPerYear) : '',
    insuranceStage: sale.insuranceStage ?? InsuranceSaleStage.RESPONSE_PENDING,
    energyStage: sale.energyStage ?? EnergySaleStage.RESPONSE_PENDING,
    expectedCloseDate: sale.expectedCloseDate ?? '',
    issueDate: sale.issueDate ?? '',
    billingDate: sale.billingDate ?? '',
    channel: sale.channel ?? '',
    probabilityPercent: sale.probabilityPercent != null ? String(sale.probabilityPercent) : '10',
    projectSource: sale.projectSource ?? '',
    contactName: sale.contactName ?? '',
    campaignSource: sale.campaignSource ?? '',
    forecastCategory: sale.forecastCategory ?? '',
    policyNumber: sale.policyNumber ?? '',
    contractId: sale.contractId ?? '',
    socialLeadId: sale.socialLeadId ?? '',
    nextStep: sale.nextStep ?? '',
    description: sale.description ?? '',
  }
}

function toInput(form: FormState): SaleInput {
  const isInsurance = form.type === SaleType.INSURANCE
  return {
    type: form.type,
    title: form.title,
    clientId: form.clientId,
    clientName: form.clientName || undefined,
    ownerUserId: form.ownerUserId || undefined,
    ownerUserName: form.ownerUserName || undefined,
    companyName: form.companyName || undefined,
    insuranceBranch: isInsurance ? form.insuranceBranch || undefined : undefined,
    businessType: form.businessType || undefined,
    amount: form.amount ? Number(form.amount) : undefined,
    expectedRevenue: form.expectedRevenue ? Number(form.expectedRevenue) : undefined,
    expectedSavingsPerYear: !isInsurance && form.expectedSavingsPerYear ? Number(form.expectedSavingsPerYear) : undefined,
    insuranceStage: isInsurance ? form.insuranceStage : undefined,
    energyStage: !isInsurance ? form.energyStage : undefined,
    expectedCloseDate: form.expectedCloseDate || undefined,
    issueDate: form.issueDate || undefined,
    billingDate: form.billingDate || undefined,
    channel: form.channel || undefined,
    probabilityPercent: form.probabilityPercent ? Number(form.probabilityPercent) : undefined,
    projectSource: form.projectSource || undefined,
    contactName: form.contactName || undefined,
    campaignSource: form.campaignSource || undefined,
    forecastCategory: form.forecastCategory || undefined,
    policyNumber: form.policyNumber || undefined,
    contractId: form.contractId || undefined,
    socialLeadId: form.socialLeadId || undefined,
    nextStep: form.nextStep || undefined,
    lostReason: undefined,
    description: form.description || undefined,
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
      const input = toInput(form)
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

        <section className="form-section">
          <h3 className="form-section-title">{t('sales.sections.saleInfo')}</h3>
          <div className="form-grid">

            <InputField
              id="sale-owner"
              label={t('sales.fields.owner')}
              value={form.ownerUserName}
              onChange={(e) => set('ownerUserName', e.target.value)}
            />
            <InputField
              id="sale-amount"
              label={t('sales.fields.amount')}
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
            />

            <InputField
              id="sale-title"
              label={t('sales.fields.title')}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              required
            />
            <InputField
              id="sale-close-date"
              label={t('sales.fields.expectedCloseDate')}
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) => set('expectedCloseDate', e.target.value)}
            />

            <InputField
              id="sale-client-name"
              label={t('sales.fields.clientName')}
              value={form.clientName}
              onChange={(e) => set('clientName', e.target.value)}
            />
            <InputField
              id="sale-issue-date"
              label={t('sales.fields.issueDate')}
              type="date"
              value={form.issueDate}
              onChange={(e) => set('issueDate', e.target.value)}
            />

            <InputField
              id="sale-company"
              label={t('sales.fields.company')}
              value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)}
            />
            <SelectField
              id="sale-stage"
              label={t('sales.fields.stage')}
              value={isInsurance ? form.insuranceStage : form.energyStage}
              onChange={(e) =>
                isInsurance
                  ? set('insuranceStage', e.target.value as InsuranceSaleStage)
                  : set('energyStage', e.target.value as EnergySaleStage)
              }
            >
              {isInsurance
                ? INSURANCE_STAGES.map((s) => (
                    <option key={s} value={s}>{t(`sales.stages.insurance.${s}`)}</option>
                  ))
                : ENERGY_STAGES.map((s) => (
                    <option key={s} value={s}>{t(`sales.stages.energy.${s}`)}</option>
                  ))
              }
            </SelectField>

            {isInsurance && (
              <InputField
                id="sale-branch"
                label={t('sales.fields.branch')}
                value={form.insuranceBranch}
                onChange={(e) => set('insuranceBranch', e.target.value)}
                placeholder="Vida, Hogar, RC, Auto..."
              />
            )}
            <InputField
              id="sale-billing-date"
              label={t('sales.fields.billingDate')}
              type="date"
              value={form.billingDate}
              onChange={(e) => set('billingDate', e.target.value)}
            />

            <SelectField
              id="sale-business-type"
              label={t('sales.fields.businessType')}
              value={form.businessType}
              onChange={(e) => set('businessType', e.target.value as SaleBusinessType | '')}
            >
              <option value="">-None-</option>
              {BUSINESS_TYPES.map((bt) => (
                <option key={bt} value={bt}>{t(`sales.businessType.${bt}`)}</option>
              ))}
            </SelectField>
            <InputField
              id="sale-channel"
              label={t('sales.fields.channel')}
              value={form.channel}
              onChange={(e) => set('channel', e.target.value)}
            />

            <InputField
              id="sale-expected-revenue"
              label={t('sales.fields.expectedRevenue')}
              type="number"
              value={form.expectedRevenue}
              onChange={() => {}}
              readOnly
            />
            <InputField
              id="sale-probability"
              label={t('sales.fields.probabilityPercent')}
              type="number"
              min="0"
              max="100"
              value={form.probabilityPercent}
              onChange={(e) => set('probabilityPercent', e.target.value)}
            />

            <SelectField
              id="sale-project-source"
              label={t('sales.fields.projectSource')}
              value={form.projectSource}
              onChange={(e) => set('projectSource', e.target.value as SaleProjectSource | '')}
            >
              <option value="">-None-</option>
              {PROJECT_SOURCES.filter((s) => s !== SaleProjectSource.NONE).map((s) => (
                <option key={s} value={s}>{t(`sales.projectSource.${s}`)}</option>
              ))}
            </SelectField>
            <InputField
              id="sale-next-step"
              label={t('sales.fields.nextStep')}
              value={form.nextStep}
              onChange={(e) => set('nextStep', e.target.value)}
            />

            <InputField
              id="sale-contact-name"
              label={t('sales.fields.contactName')}
              value={form.contactName}
              onChange={(e) => set('contactName', e.target.value)}
            />
            <InputField
              id="sale-campaign-source"
              label={t('sales.fields.campaignSource')}
              value={form.campaignSource}
              onChange={(e) => set('campaignSource', e.target.value)}
            />

            <InputField
              id="sale-policy-number"
              label={t('sales.fields.policyNumber')}
              value={form.policyNumber}
              onChange={(e) => set('policyNumber', e.target.value)}
            />
            <SelectField
              id="sale-forecast-category"
              label={t('sales.fields.forecastCategory')}
              value={form.forecastCategory}
              onChange={(e) => set('forecastCategory', e.target.value as SaleForecastCategory | '')}
            >
              <option value="">-None-</option>
              {FORECAST_CATEGORIES.map((fc) => (
                <option key={fc} value={fc}>{t(`sales.forecastCategory.${fc}`)}</option>
              ))}
            </SelectField>

            <InputField
              id="sale-contract-id"
              label={t('sales.fields.contractId')}
              value={form.contractId}
              onChange={(e) => set('contractId', e.target.value)}
            />
            <InputField
              id="sale-social-lead-id"
              label={t('sales.fields.socialLeadId')}
              value={form.socialLeadId}
              onChange={(e) => set('socialLeadId', e.target.value)}
            />

            {!isInsurance && (
              <InputField
                id="sale-savings"
                label={t('sales.fields.expectedSavings')}
                type="number"
                min="0"
                step="0.01"
                value={form.expectedSavingsPerYear}
                onChange={(e) => set('expectedSavingsPerYear', e.target.value)}
              />
            )}

          </div>
        </section>

        <section className="form-section">
          <h3 className="form-section-title">{t('sales.sections.description')}</h3>
          <div className="form-grid">
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
