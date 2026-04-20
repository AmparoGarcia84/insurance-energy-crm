import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import InputField from '../FormField/InputField'
import SelectField from '../FormField/SelectField'
import TextareaField from '../FormField/TextareaField'
import ConfirmModal from '../ConfirmModal/ConfirmModal'
import SaleTypeToggle from '../SaleTypeToggle/SaleTypeToggle'
import { useClients } from '../../context/DataContext'
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
  /** Pre-fill client when creating a new sale from a client context. */
  defaultClientId?: string
  defaultClientName?: string
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

export default function SaleForm({ sale, defaultClientId, defaultClientName, onSave, onCancel, onDelete }: Props) {
  const { t } = useTranslation()
  const isNew = sale === null
  const { clients, loading: clientsLoading } = useClients()

  const [form, setForm] = useState<FormState>(() => {
    if (sale) return toFormState(sale)
    return { ...EMPTY, clientId: defaultClientId ?? '', clientName: defaultClientName ?? '' }
  })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [clientQuery, setClientQuery] = useState(() => sale?.clientName ?? defaultClientName ?? '')
  const [showClientOptions, setShowClientOptions] = useState(false)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const filteredClients = useMemo(() => {
    const query = clientQuery.trim().toLowerCase()
    if (!query) return clients.slice(0, 20)
    return clients
      .filter((client) => {
        const searchable = [
          client.name,
          client.clientNumber ?? '',
          client.nif ?? '',
        ].join(' ').toLowerCase()
        return searchable.includes(query)
      })
      .slice(0, 20)
  }, [clients, clientQuery])

  function formatClientOption(client: { name: string; clientNumber?: string; nif?: string }): string {
    const suffix = [client.clientNumber ? `#${client.clientNumber}` : '', client.nif ?? '']
      .filter(Boolean)
      .join(' · ')
    return suffix ? `${client.name} (${suffix})` : client.name
  }

  function renderHighlighted(text: string, query: string): ReactNode {
    const trimmed = query.trim()
    if (!trimmed) return text

    const lowerText = text.toLowerCase()
    const lowerQuery = trimmed.toLowerCase()
    const idx = lowerText.indexOf(lowerQuery)
    if (idx === -1) return text

    const before = text.slice(0, idx)
    const match = text.slice(idx, idx + trimmed.length)
    const after = text.slice(idx + trimmed.length)
    return (
      <>
        {before}
        <mark className="sale-form__client-highlight">{match}</mark>
        {after}
      </>
    )
  }

  function selectClient(clientId: string) {
    const selected = clients.find((c) => c.id === clientId)
    if (!selected) return
    set('clientId', selected.id)
    set('clientName', selected.name)
    setClientQuery(selected.name)
    setShowClientOptions(false)
  }

  useEffect(() => {
    if (!form.clientId) return
    const selected = clients.find((c) => c.id === form.clientId)
    if (!selected) return
    setClientQuery((current) => current || selected.name)
  }, [clients, form.clientId])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.title.trim() || !form.clientId) return
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
    <div className="sale-form-view">
      <div className="sale-form-header">
        <button type="button" className="icon-btn sale-form-back" onClick={onCancel}>
          <ChevronLeft size={18} />
          {t('sales.backToBoard')}
        </button>
        <h1 className="sale-form__title">{isNew ? t('sales.new') : t('sales.edit')}</h1>
      </div>

      <form className="sale-form form-card" onSubmit={handleSave}>

        {isNew && (
          <SaleTypeToggle
            className="sales__toggle"
            value={form.type}
            onChange={(nextType) => set('type', nextType)}
            insuranceLabel={t('sales.toggleInsurance')}
            energyLabel={t('sales.toggleEnergy')}
          />
        )}

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

            <div className="form-field sale-form__client-field">
              <label htmlFor="sale-client-name">{t('sales.fields.clientName')}</label>
              <input
                id="sale-client-name"
                type="text"
                autoComplete="off"
                value={clientQuery}
                placeholder={t('sales.clientSearchPlaceholder')}
                onFocus={() => setShowClientOptions(true)}
                onBlur={() => setTimeout(() => setShowClientOptions(false), 120)}
                onChange={(e) => {
                  const value = e.target.value
                  setClientQuery(value)
                  set('clientId', '')
                  set('clientName', value)
                  setShowClientOptions(true)
                }}
              />
              {showClientOptions && (
                <div className="sale-form__client-options">
                  {clientsLoading && (
                    <div className="sale-form__client-option sale-form__client-option--status">
                      {t('sales.clientLoading')}
                    </div>
                  )}
                  {!clientsLoading && filteredClients.length === 0 && (
                    <div className="sale-form__client-option sale-form__client-option--status">
                      {t('sales.clientNoMatches')}
                    </div>
                  )}
                  {!clientsLoading && filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      className="sale-form__client-option"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        selectClient(client.id)
                      }}
                    >
                      {renderHighlighted(formatClientOption(client), clientQuery)}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
          <button type="submit" className="btn-primary" disabled={saving || !form.title.trim() || !form.clientId}>
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
    </div>
  )
}
