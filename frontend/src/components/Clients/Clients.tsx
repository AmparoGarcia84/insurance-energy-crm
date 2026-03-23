import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
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
  getClients,
  createClient,
  updateClient,
  deleteClient,
  type Client,
  type ClientInput,
} from '../../api/clients'
import InputField from '../FormField/InputField'
import SelectField from '../FormField/SelectField'
import TextareaField from '../FormField/TextareaField'
import AddressForm from '../AddressForm/AddressForm'
import './Clients.css'

const CLIENT_TYPES          = Object.values(ClientType)
const CLIENT_STATUSES       = Object.values(ClientStatus)
const CLIENT_QUALIFICATIONS = Object.values(ClientQualification)
const COLLECTION_MANAGERS   = Object.values(CollectionManager)
const ACTIVITIES            = Object.entries(ClientActivityLabels) as [ClientActivity, string][]
const SECTORS               = Object.entries(ClientSectorLabels)   as [ClientSector, string][]

const EMPTY_FORM: ClientInput = {
  // Identificación
  displayName: '', clientNumber: '', legalName: '', taxId: '',
  // Clasificación
  type: ClientType.INDIVIDUAL, status: ClientStatus.LEAD, qualification: undefined,
  activity: '', sector: '', collectionManager: undefined,
  // Fechas
  birthDate: '', drivingLicenseIssueDate: '', dniExpiryDate: '',
  // Contacto
  mobilePhone: '', phone: '', secondaryPhone: '', email: '', fax: '', website: '',
  // Dirección
  street: '', postalCode: '', city: '', province: '', country: '',
  // Empresa
  iban: '', employees: undefined, annualRevenue: undefined,
  // Jerarquía
  isMainClient: false, mainClientId: '',
  // Observaciones
  notes: '', description: '',
}

export default function Clients() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const canDelete = user?.role === 'OWNER'

  const [clients, setClients]   = useState<Client[]>([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState<Client | null>(null)
  const [isNew, setIsNew]       = useState(false)
  const [form, setForm]         = useState<ClientInput>(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    getClients().then(setClients).finally(() => setLoading(false))
  }, [])

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.displayName.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.taxId?.toLowerCase().includes(q)
    )
  })

  function openNew() { setForm(EMPTY_FORM); setEditing(null); setIsNew(true) }

  function openEdit(client: Client) {
    setForm({
      displayName: client.displayName, clientNumber: client.clientNumber ?? '',
      legalName: client.legalName ?? '', taxId: client.taxId ?? '',
      type: client.type, status: client.status,
      qualification: client.qualification, activity: client.activity ?? '',
      sector: client.sector ?? '', collectionManager: client.collectionManager,
      birthDate: client.birthDate ?? '', drivingLicenseIssueDate: client.drivingLicenseIssueDate ?? '',
      dniExpiryDate: client.dniExpiryDate ?? '',
      mobilePhone: client.mobilePhone ?? '', phone: client.phone ?? '',
      secondaryPhone: client.secondaryPhone ?? '', email: client.email ?? '',
      fax: client.fax ?? '', website: client.website ?? '',
      street: client.street ?? '', postalCode: client.postalCode ?? '',
      city: client.city ?? '', province: client.province ?? '', country: client.country ?? '',
      iban: client.iban ?? '',
      employees: client.employees, annualRevenue: client.annualRevenue,
      isMainClient: client.isMainClient ?? false, mainClientId: client.mainClientId ?? '',
      notes: client.notes ?? '', description: client.description ?? '',
    })
    setEditing(client); setIsNew(false)
  }

  function closeForm() { setEditing(null); setIsNew(false) }

  function set<K extends keyof ClientInput>(key: K, value: ClientInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      if (isNew) {
        const created = await createClient(form)
        setClients((prev) => [...prev, created].sort((a, b) => a.displayName.localeCompare(b.displayName)))
      } else if (editing) {
        const updated = await updateClient(editing.id, form)
        setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      }
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(client: Client) {
    if (!confirm(t('clients.deleteConfirm', { name: client.displayName }))) return
    await deleteClient(client.id)
    setClients((prev) => prev.filter((c) => c.id !== client.id))
  }

  // ── Form view ────────────────────────────────────────────────────────────
  if (isNew || editing) {
    return (
      <div className="clients-form-view">
        <div className="clients-form-header">
          <h1>{isNew ? t('clients.new') : t('clients.edit')}</h1>
        </div>

        <form className="clients-form" onSubmit={handleSave}>

          {/* ── Identificación ── */}
          <section className="form-section">
            <h2 className="form-section-title">{t('clients.sections.identification')}</h2>
            <div className="clients-form-grid">
              <InputField id="client-displayName" label={`${t('clients.fields.displayName')} *`} className="col-span-2"
                name="displayName" type="text" autoComplete="off" required
                value={form.displayName} onChange={(e) => set('displayName', e.target.value)} />
              <InputField id="client-legalName" label={t('clients.fields.legalName')}
                name="legalName" type="text" autoComplete="off"
                value={form.legalName} onChange={(e) => set('legalName', e.target.value)} />
              <InputField id="client-clientNumber" label={t('clients.fields.clientNumber')}
                name="clientNumber" type="text" autoComplete="off"
                value={form.clientNumber} onChange={(e) => set('clientNumber', e.target.value)} />
              <InputField id="client-taxId" label={t('clients.fields.taxId')}
                name="taxId" type="text" autoComplete="off"
                value={form.taxId} onChange={(e) => set('taxId', e.target.value)} />
            </div>
          </section>

          {/* ── Clasificación ── */}
          <section className="form-section">
            <h2 className="form-section-title">{t('clients.sections.classification')}</h2>
            <div className="clients-form-grid">
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
            <div className="clients-form-grid">
              <InputField id="client-mobilePhone" label={t('clients.fields.mobilePhone')}
                name="mobilePhone" type="tel" autoComplete="off"
                value={form.mobilePhone} onChange={(e) => set('mobilePhone', e.target.value)} />
              <InputField id="client-phone" label={t('clients.fields.phone')}
                name="phone" type="tel" autoComplete="off"
                value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              <InputField id="client-secondaryPhone" label={t('clients.fields.secondaryPhone')}
                name="secondaryPhone" type="tel" autoComplete="off"
                value={form.secondaryPhone} onChange={(e) => set('secondaryPhone', e.target.value)} />
              <InputField id="client-email" label={t('clients.fields.email')}
                name="email" type="email" autoComplete="off"
                value={form.email} onChange={(e) => set('email', e.target.value)} />
              <InputField id="client-fax" label={t('clients.fields.fax')}
                name="fax" type="tel" autoComplete="off"
                value={form.fax} onChange={(e) => set('fax', e.target.value)} />
              <InputField id="client-website" label={t('clients.fields.website')}
                name="website" type="url" autoComplete="off"
                value={form.website} onChange={(e) => set('website', e.target.value)} />
            </div>
          </section>

          {/* ── Dirección ── */}
          <section className="form-section">
            <h2 className="form-section-title">{t('clients.sections.address')}</h2>
            <AddressForm
              value={{ street: form.street, postalCode: form.postalCode, city: form.city, province: form.province, country: form.country }}
              onChange={(addr) => setForm((f) => ({ ...f, ...addr }))}
            />
          </section>

          {/* ── Documentación y datos personales ── */}
          <section className="form-section">
            <h2 className="form-section-title">{t('clients.sections.personal')}</h2>
            <div className="clients-form-grid">
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
            <div className="clients-form-grid">
              <InputField id="client-iban" label={t('clients.fields.iban')}
                name="iban" type="text" autoComplete="off"
                value={form.iban} onChange={(e) => set('iban', e.target.value)} />
              <InputField id="client-employees" label={t('clients.fields.employees')}
                name="employees" type="number" min={0} autoComplete="off"
                value={form.employees ?? ''} onChange={(e) => set('employees', e.target.value ? Number(e.target.value) : undefined)} />
              <InputField id="client-annualRevenue" label={t('clients.fields.annualRevenue')}
                name="annualRevenue" type="number" min={0} step={0.01} autoComplete="off"
                value={form.annualRevenue ?? ''} onChange={(e) => set('annualRevenue', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </section>

          {/* ── Observaciones ── */}
          <section className="form-section">
            <h2 className="form-section-title">{t('clients.sections.notes')}</h2>
            <TextareaField id="client-description" label={t('clients.fields.description')}
              name="description" rows={3}
              value={form.description} onChange={(e) => set('description', e.target.value)} />
            <TextareaField id="client-notes" label={t('clients.fields.notes')}
              name="notes" rows={2}
              value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </section>

          <div className="clients-form-actions">
            <button type="button" className="btn-secondary" onClick={closeForm}>
              {t('clients.actions.cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={saving || !form.displayName}>
              {saving ? t('clients.actions.saving') : t('clients.actions.save')}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="clients-list-view">
      <div className="clients-list-header">
        <h1>{t('clients.title')}</h1>
        <button className="btn-primary" onClick={openNew}>
          <Plus size={16} />
          {t('clients.new')}
        </button>
      </div>

      <div className="clients-search">
        <Search size={16} />
        <input
          id="clients-search" name="clients-search" type="search" autoComplete="off"
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t('clients.search')}
        />
      </div>

      {loading ? null : filtered.length === 0 ? (
        <p className="clients-empty">
          {search ? t('clients.emptySearch') : t('clients.empty')}
        </p>
      ) : (
        <div className="clients-table-wrap">
          <table className="clients-table">
            <thead>
              <tr>
                <th>{t('clients.fields.displayName')}</th>
                <th>{t('clients.fields.type')}</th>
                <th>{t('clients.fields.status')}</th>
                <th>{t('clients.fields.phone')}</th>
                <th>{t('clients.fields.email')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="clients-name">
                    <span>{c.displayName}</span>
                    {c.legalName && <small>{c.legalName}</small>}
                  </td>
                  <td>
                    <span className={`badge badge-type badge-type-${c.type.toLowerCase()}`}>
                      {ClientTypeLabels[c.type]}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-status badge-status-${c.status.toLowerCase()}`}>
                      {ClientStatusLabels[c.status]}
                    </span>
                  </td>
                  <td>{c.mobilePhone ?? c.phone ?? '—'}</td>
                  <td>{c.email ?? '—'}</td>
                  <td className="clients-actions">
                    <button className="icon-btn" onClick={() => openEdit(c)} title={t('clients.edit')}>
                      <Pencil size={15} />
                    </button>
                    {canDelete && (
                      <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(c)} title={t('clients.actions.delete')}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
