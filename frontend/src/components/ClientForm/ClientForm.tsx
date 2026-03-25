import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ClientType,
  ClientStatus,
  ClientQualification,
  CollectionManager,
  ClientActivity,
  ClientSector,
  ClientTypeLabels,
  ClientStatusLabels,
  ClientQualificationLabels,
  CollectionManagerLabels,
  ClientActivityLabels,
  ClientSectorLabels,
} from '@crm/shared'
import {
  createClient,
  updateClient,
  type Client,
  type ClientInput,
} from '../../api/clients'
import InputField from '../FormField/InputField'
import SelectField from '../FormField/SelectField'
import TextareaField from '../FormField/TextareaField'
import AddressList from '../AddressList/AddressList'
import BankAccountList from '../BankAccountList/BankAccountList'
import './ClientForm.css'

const CLIENT_TYPES          = Object.values(ClientType)
const CLIENT_STATUSES       = Object.values(ClientStatus)
const CLIENT_QUALIFICATIONS = Object.values(ClientQualification)
const COLLECTION_MANAGERS   = Object.values(CollectionManager)
const ACTIVITIES            = Object.entries(ClientActivityLabels) as [ClientActivity, string][]
const SECTORS               = Object.entries(ClientSectorLabels)   as [ClientSector, string][]

// Default values for a blank new-client form
const EMPTY_FORM: ClientInput = {
  name: '', clientNumber: '', nif: '',
  type: ClientType.INDIVIDUAL, status: ClientStatus.LEAD, qualification: undefined,
  activity: '', sector: '', collectionManager: undefined,
  birthDate: '', drivingLicenseIssueDate: '', dniExpiryDate: '',
  mobilePhone: '', secondaryPhone: '', email: '', website: '',
  employees: undefined, annualRevenue: undefined, sicCode: '',
  accountOwnerUserId: '', commercialAgentUserId: '',
  contractsCounterpartyId: '',
  isMainClient: false, mainClientId: '',
  description: '',
  addresses: [], bankAccounts: [],
}

// Truncate an ISO datetime string to the yyyy-MM-dd format required by <input type="date">
function toDateInput(iso?: string): string {
  return iso ? iso.slice(0, 10) : ''
}

// Map a Client (from the API) to the flat ClientInput shape used by the form.
// Nullish fields are coerced to empty strings so controlled inputs never go uncontrolled.
// Relation arrays are stripped down to their input-only fields (no id, no clientId).
function toFormValues(client: Client): ClientInput {
  return {
    name: client.name, clientNumber: client.clientNumber ?? '', nif: client.nif ?? '',
    type: client.type, status: client.status,
    qualification: client.qualification, activity: client.activity ?? '',
    sector: client.sector ?? '', collectionManager: client.collectionManager,
    birthDate: toDateInput(client.birthDate), drivingLicenseIssueDate: toDateInput(client.drivingLicenseIssueDate),
    dniExpiryDate: toDateInput(client.dniExpiryDate),
    mobilePhone: client.mobilePhone ?? '', secondaryPhone: client.secondaryPhone ?? '',
    email: client.email ?? '', website: client.website ?? '',
    employees: client.employees, annualRevenue: client.annualRevenue, sicCode: client.sicCode ?? '',
    accountOwnerUserId: client.accountOwnerUserId ?? '', commercialAgentUserId: client.commercialAgentUserId ?? '',
    contractsCounterpartyId: client.contractsCounterpartyId ?? '',
    isMainClient: client.isMainClient ?? false, mainClientId: client.mainClientId ?? '',
    description: client.description ?? '',
    addresses:    client.addresses?.map(({ type, street, postalCode, city, province, country }) => ({ type, street, postalCode, city, province, country })) ?? [],
    bankAccounts: client.bankAccounts?.map(({ type, iban }) => ({ type, iban })) ?? [],
  }
}

interface Props {
  client: Client | null
  onSave: (saved: Client) => void
  onCancel: () => void
}

export default function ClientForm({ client, onSave, onCancel }: Props) {
  const { t } = useTranslation()
  const isNew = client === null

  // Lazy initializer runs only once — avoids re-deriving form values on every render
  const [form, setForm] = useState<ClientInput>(() =>
    client ? toFormValues(client) : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)

  function set<K extends keyof ClientInput>(key: K, value: ClientInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      const saved = isNew
        ? await createClient(form)
        : await updateClient(client.id, form)
      onSave(saved)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="client-form-view">
      <div className="client-form-header">
        <h1>{isNew ? t('clients.new') : t('clients.edit')}</h1>
      </div>

      <form className="client-form" onSubmit={handleSave}>

        {/* ── Identificación ── */}
        <section className="form-section">
          <h2 className="form-section-title">{t('clients.sections.identification')}</h2>
          <div className="client-form-grid">
            <InputField id="client-name" label={`${t('clients.fields.name')} *`} className="col-span-2"
              name="name" type="text" autoComplete="off" required
              value={form.name} onChange={(e) => set('name', e.target.value)} />
            <InputField id="client-nif" label={t('clients.fields.nif')}
              name="nif" type="text" autoComplete="off"
              value={form.nif} onChange={(e) => set('nif', e.target.value)} />
            <InputField id="client-clientNumber" label={t('clients.fields.clientNumber')}
              name="clientNumber" type="text" autoComplete="off"
              value={form.clientNumber} onChange={(e) => set('clientNumber', e.target.value)} />
          </div>
        </section>

        {/* ── Clasificación ── */}
        <section className="form-section">
          <h2 className="form-section-title">{t('clients.sections.classification')}</h2>
          <div className="client-form-grid">
            <SelectField id="client-type" label={t('clients.fields.type')}
              name="type" value={form.type} onChange={(e) => set('type', e.target.value as ClientType)}>
              {CLIENT_TYPES.map((v) => <option key={v} value={v}>{ClientTypeLabels[v]}</option>)}
            </SelectField>
            <SelectField id="client-status" label={t('clients.fields.status')}
              name="status" value={form.status} onChange={(e) => set('status', e.target.value as ClientStatus)}>
              {CLIENT_STATUSES.map((v) => <option key={v} value={v}>{ClientStatusLabels[v]}</option>)}
            </SelectField>
            <SelectField id="client-qualification" label={t('clients.fields.qualification')}
              name="qualification" value={form.qualification ?? ''}
              onChange={(e) => set('qualification', (e.target.value || undefined) as ClientQualification | undefined)}>
              <option value="">{t('clients.fields.none')}</option>
              {CLIENT_QUALIFICATIONS.map((v) => <option key={v} value={v}>{ClientQualificationLabels[v]}</option>)}
            </SelectField>
            <SelectField id="client-collectionManager" label={t('clients.fields.collectionManager')}
              name="collectionManager" value={form.collectionManager ?? ''}
              onChange={(e) => set('collectionManager', (e.target.value || undefined) as CollectionManager | undefined)}>
              <option value="">{t('clients.fields.none')}</option>
              {COLLECTION_MANAGERS.map((v) => <option key={v} value={v}>{CollectionManagerLabels[v]}</option>)}
            </SelectField>
            <SelectField id="client-activity" label={t('clients.fields.activity')}
              name="activity" value={form.activity ?? ''}
              onChange={(e) => set('activity', e.target.value || '')}>
              <option value="">{t('clients.fields.none')}</option>
              {ACTIVITIES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </SelectField>
            <SelectField id="client-sector" label={t('clients.fields.sector')}
              name="sector" value={form.sector ?? ''}
              onChange={(e) => set('sector', e.target.value || '')}>
              <option value="">{t('clients.fields.none')}</option>
              {SECTORS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </SelectField>
          </div>
        </section>

        {/* ── Contacto ── */}
        <section className="form-section">
          <h2 className="form-section-title">{t('clients.sections.contact')}</h2>
          <div className="client-form-grid">
            <InputField id="client-mobilePhone" label={t('clients.fields.mobilePhone')}
              name="mobilePhone" type="tel" autoComplete="off"
              value={form.mobilePhone} onChange={(e) => set('mobilePhone', e.target.value)} />
            <InputField id="client-secondaryPhone" label={t('clients.fields.secondaryPhone')}
              name="secondaryPhone" type="tel" autoComplete="off"
              value={form.secondaryPhone} onChange={(e) => set('secondaryPhone', e.target.value)} />
            <InputField id="client-email" label={t('clients.fields.email')}
              name="email" type="email" autoComplete="off"
              value={form.email} onChange={(e) => set('email', e.target.value)} />
            <InputField id="client-website" label={t('clients.fields.website')}
              name="website" type="text" autoComplete="off"
              value={form.website} onChange={(e) => set('website', e.target.value)} />
          </div>
        </section>

        {/* ── Direcciones ── */}
        <section className="form-section">
          <h2 className="form-section-title">{t('clients.sections.addresses')}</h2>
          <AddressList
            value={form.addresses ?? []}
            onChange={(addresses) => set('addresses', addresses)}
          />
        </section>

        {/* ── Documentación y datos personales ── */}
        <section className="form-section">
          <h2 className="form-section-title">{t('clients.sections.personal')}</h2>
          <div className="client-form-grid">
            <InputField id="client-birthDate" label={t('clients.fields.birthDate')}
              name="birthDate" type="date" autoComplete="off"
              value={form.birthDate ?? ''} onChange={(e) => set('birthDate', e.target.value || undefined)} />
            <InputField id="client-dniExpiryDate" label={t('clients.fields.dniExpiryDate')}
              name="dniExpiryDate" type="date" autoComplete="off"
              value={form.dniExpiryDate ?? ''} onChange={(e) => set('dniExpiryDate', e.target.value || undefined)} />
            <InputField id="client-drivingLicenseIssueDate" label={t('clients.fields.drivingLicenseIssueDate')}
              name="drivingLicenseIssueDate" type="date" autoComplete="off"
              value={form.drivingLicenseIssueDate ?? ''} onChange={(e) => set('drivingLicenseIssueDate', e.target.value || undefined)} />
          </div>
        </section>

        {/* ── Empresa y facturación ── */}
        <section className="form-section">
          <h2 className="form-section-title">{t('clients.sections.business')}</h2>
          <div className="client-form-grid">
            <InputField id="client-employees" label={t('clients.fields.employees')}
              name="employees" type="number" min={0} autoComplete="off"
              value={form.employees ?? ''} onChange={(e) => set('employees', e.target.value ? Number(e.target.value) : undefined)} />
            <InputField id="client-annualRevenue" label={t('clients.fields.annualRevenue')}
              name="annualRevenue" type="number" min={0} step={0.01} autoComplete="off"
              value={form.annualRevenue ?? ''} onChange={(e) => set('annualRevenue', e.target.value ? Number(e.target.value) : undefined)} />
            <InputField id="client-sicCode" label={t('clients.fields.sicCode')}
              name="sicCode" type="text" autoComplete="off"
              value={form.sicCode ?? ''} onChange={(e) => set('sicCode', e.target.value)} />
          </div>
        </section>

        {/* ── Gestión comercial ── */}
        <section className="form-section">
          <h2 className="form-section-title">{t('clients.sections.commercial')}</h2>
          <div className="client-form-grid">
            <InputField id="client-accountOwnerUserId" label={t('clients.fields.accountOwnerUserId')}
              name="accountOwnerUserId" type="text" autoComplete="off"
              value={form.accountOwnerUserId ?? ''} onChange={(e) => set('accountOwnerUserId', e.target.value)} />
            <InputField id="client-commercialAgentUserId" label={t('clients.fields.commercialAgentUserId')}
              name="commercialAgentUserId" type="text" autoComplete="off"
              value={form.commercialAgentUserId ?? ''} onChange={(e) => set('commercialAgentUserId', e.target.value)} />
            <InputField id="client-contractsCounterpartyId" label={t('clients.fields.contractsCounterpartyId')}
              name="contractsCounterpartyId" type="text" autoComplete="off"
              value={form.contractsCounterpartyId ?? ''} onChange={(e) => set('contractsCounterpartyId', e.target.value)} />
          </div>
        </section>

        {/* ── Cuentas bancarias ── */}
        <section className="form-section">
          <h2 className="form-section-title">{t('clients.sections.bankAccounts')}</h2>
          <BankAccountList
            value={form.bankAccounts ?? []}
            onChange={(bankAccounts) => set('bankAccounts', bankAccounts)}
          />
        </section>

        {/* ── Observaciones ── */}
        <section className="form-section">
          <h2 className="form-section-title">{t('clients.sections.notes')}</h2>
          <TextareaField id="client-description" label={t('clients.fields.description')}
            name="description" rows={4}
            value={form.description} onChange={(e) => set('description', e.target.value)} />
        </section>

        <div className="client-form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {t('clients.actions.cancel')}
          </button>
          <button type="submit" className="btn-primary" disabled={saving || !form.name}>
            {saving ? t('clients.actions.saving') : t('clients.actions.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
