import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import {
  createCase,
  updateCase,
  type Case,
  type CaseInput,
  type CaseStatus,
  type CasePriority,
  type CaseType,
} from '../../../api/cases'
import { getSuppliers, type Supplier } from '../../../api/suppliers'
import { useClients } from '../../../context/DataContext'
import { useSales } from '../../../context/DataContext'
import { usePermissions } from '../../../hooks/usePermissions'
import InputField from '../../shared/FormField/InputField'
import SelectField from '../../shared/FormField/SelectField'
import TextareaField from '../../shared/FormField/TextareaField'
import SearchableSelectField from '../../shared/FormField/SearchableSelectField'
import ConfirmModal from '../../shared/ConfirmModal/ConfirmModal'
import './CaseForm.css'

const STATUSES:   CaseStatus[]   = ['NEW', 'ON_HOLD', 'FORWARDED', 'IN_PROGRESS', 'CLOSED']
const PRIORITIES: CasePriority[] = ['HIGH', 'NORMAL', 'LOW']
const TYPES: CaseType[] = ['CLAIM', 'FAULT', 'ACTIVATION', 'WRONG_SETTLEMENT']

const NAME_MAX  = 200
const DESC_MAX  = 2000
const CAUSE_MAX = 1000

interface FormState {
  clientId:     string
  saleId:       string
  name:         string
  occurrenceAt: string
  description:  string
  cause:        string
  type:         CaseType | ''
  status:       CaseStatus
  priority:     CasePriority
  supplierId:   string
}

const EMPTY: FormState = {
  clientId:     '',
  saleId:       '',
  name:         '',
  occurrenceAt: '',
  description:  '',
  cause:        '',
  type:         '',
  status:       'NEW',
  priority:     'NORMAL',
  supplierId:   '',
}

function toFormState(c: Case): FormState {
  // occurrenceAt from ISO string → datetime-local input format (YYYY-MM-DDTHH:mm)
  const occurrenceAt = c.occurrenceAt
    ? c.occurrenceAt.slice(0, 16)
    : ''
  return {
    clientId:     c.clientId,
    saleId:       c.saleId ?? '',
    name:         c.name,
    occurrenceAt,
    description:  c.description ?? '',
    cause:        c.cause       ?? '',
    type:         c.type        ?? '',
    status:       c.status,
    priority:     c.priority,
    supplierId:   c.supplierId  ?? '',
  }
}

interface Props {
  case:    Case | null
  onSave:   (saved: Case) => void
  onCancel: () => void
  onDelete?: (id: string) => void
  /** Pre-fill client when opening from a client's detail view. */
  initialClientId?: string
  /** Pre-fill sale (and derive client) when opening from a sale's detail view. */
  initialSaleId?: string
}

export default function CaseForm({
  case: caseItem,
  onSave,
  onCancel,
  onDelete,
  initialClientId,
  initialSaleId,
}: Props) {
  const { t } = useTranslation()
  const isNew = caseItem === null
  const { canDelete } = usePermissions()
  const { clients, loading: clientsLoading } = useClients()
  const { sales } = useSales()

  const [form, setForm] = useState<FormState>(() => {
    if (!isNew) return toFormState(caseItem)
    return {
      ...EMPTY,
      clientId: initialClientId ?? '',
      saleId:   initialSaleId  ?? '',
    }
  })
  const [saving, setSaving]               = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [suppliers, setSuppliers]         = useState<Supplier[]>([])
  const [suppliersLoading, setSuppliersLoading] = useState(false)

  // Derive client from the selected sale (cascade)
  useEffect(() => {
    if (!form.saleId) return
    const sale = sales.find((s) => s.id === form.saleId)
    if (sale && sale.clientId !== form.clientId) {
      setForm((f) => ({ ...f, clientId: sale.clientId }))
    }
  }, [form.saleId, sales]) // eslint-disable-line react-hooks/exhaustive-deps

  // When client changes, reset sale if it doesn't belong to the new client
  function handleClientChange(clientId: string) {
    setForm((f) => {
      const saleStillValid = f.saleId && sales.some(
        (s) => s.id === f.saleId && s.clientId === clientId
      )
      return { ...f, clientId, saleId: saleStillValid ? f.saleId : '' }
    })
  }

  // Load suppliers once (needed for WRONG_SETTLEMENT)
  useEffect(() => {
    setSuppliersLoading(true)
    getSuppliers()
      .then(setSuppliers)
      .catch(() => setSuppliers([]))
      .finally(() => setSuppliersLoading(false))
  }, [])

  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.name })),
    [clients]
  )

  const saleOptions = useMemo(() => {
    const clientSales = form.clientId
      ? sales.filter((s) => s.clientId === form.clientId)
      : []
    return clientSales.map((s) => ({ value: s.id, label: s.title }))
  }, [form.clientId, sales])

  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ value: s.id, label: s.cif ? `${s.name} (${s.cif})` : s.name })),
    [suppliers]
  )

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const input: CaseInput = {
        clientId:     form.clientId,
        saleId:       form.saleId      || null,
        name:         form.name,
        occurrenceAt: form.occurrenceAt ? new Date(form.occurrenceAt).toISOString() : null,
        description:  form.description || null,
        cause:        form.cause       || null,
        type:         (form.type as CaseType) || null,
        status:       form.status,
        priority:     form.priority,
        supplierId:   form.type === 'WRONG_SETTLEMENT' ? (form.supplierId || null) : null,
      }
      const saved = isNew
        ? await createCase(input)
        : await updateCase(caseItem.id, input)
      onSave(saved)
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = !!form.clientId && !!form.name.trim() && !saving

  return (
    <div className="case-form-view">
      <div className="page-header">
        <h1 className="page-title">
          {isNew ? t('cases.new') : t('cases.edit')}
        </h1>
        {!isNew && canDelete && onDelete && (
          <button
            type="button"
            className="btn-danger"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={15} />
            {t('cases.actions.delete')}
          </button>
        )}
      </div>

      <form className="case-form form-card" onSubmit={handleSave}>

        {/* ── Main data ─────────────────────────────────────────────────────── */}
        <section className="form-section">
          <h2 className="form-section-title">{t('cases.sections.main')}</h2>
          <div className="form-grid">

            <SearchableSelectField
              id="case-client"
              label={`${t('cases.fields.client')} *`}
              name="clientId"
              value={form.clientId}
              options={clientOptions}
              emptyLabel={clientsLoading ? t('cases.fields.clientLoading') : t('cases.fields.clientPlaceholder')}
              searchPlaceholder={t('common.searchOptions')}
              noResultsLabel={t('common.noResults')}
              onChange={handleClientChange}
            />

            <SearchableSelectField
              id="case-sale"
              label={t('cases.fields.sale')}
              name="saleId"
              value={form.saleId}
              options={saleOptions}
              emptyLabel={form.clientId ? t('cases.fields.salePlaceholder') : t('cases.fields.saleNone')}
              searchPlaceholder={t('common.searchOptions')}
              noResultsLabel={t('common.noResults')}
              onChange={(val) => set('saleId', val)}
            />

            <InputField
              id="case-name"
              label={`${t('cases.fields.name')} *`}
              name="name"
              type="text"
              autoComplete="off"
              required
              maxLength={NAME_MAX}
              className="col-span-2"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />

            <InputField
              id="case-occurrence"
              label={t('cases.fields.occurrenceAt')}
              name="occurrenceAt"
              type="datetime-local"
              value={form.occurrenceAt}
              onChange={(e) => set('occurrenceAt', e.target.value)}
            />

            <SelectField
              id="case-type"
              label={t('cases.fields.type')}
              name="type"
              value={form.type}
              onChange={(e) => set('type', e.target.value as CaseType | '')}
            >
              <option value="">{t('cases.fields.typePlaceholder')}</option>
              {TYPES.map((tp) => (
                <option key={tp} value={tp}>{t(`cases.type.${tp}`)}</option>
              ))}
            </SelectField>

            <SelectField
              id="case-status"
              label={t('cases.fields.status')}
              name="status"
              value={form.status}
              onChange={(e) => set('status', e.target.value as CaseStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{t(`cases.status.${s}`)}</option>
              ))}
            </SelectField>

            <SelectField
              id="case-priority"
              label={t('cases.fields.priority')}
              name="priority"
              value={form.priority}
              onChange={(e) => set('priority', e.target.value as CasePriority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{t(`cases.priority.${p}`)}</option>
              ))}
            </SelectField>

            {/* Supplier — only shown for WRONG_SETTLEMENT */}
            {form.type === 'WRONG_SETTLEMENT' && (
              <SearchableSelectField
                id="case-supplier"
                label={t('cases.fields.supplier')}
                name="supplierId"
                value={form.supplierId}
                options={supplierOptions}
                emptyLabel={suppliersLoading ? t('cases.fields.supplierLoading') : t('cases.fields.supplierPlaceholder')}
                searchPlaceholder={t('common.searchOptions')}
                noResultsLabel={t('common.noResults')}
                onChange={(val) => set('supplierId', val)}
              />
            )}

          </div>
        </section>

        {/* ── Description & cause ───────────────────────────────────────────── */}
        <section className="form-section">
          <h2 className="form-section-title">{t('cases.sections.description')}</h2>
          <div className="form-grid">
            <TextareaField
              id="case-description"
              label={t('cases.fields.description')}
              name="description"
              rows={4}
              maxLength={DESC_MAX}
              className="col-span-2"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
            <TextareaField
              id="case-cause"
              label={t('cases.fields.cause')}
              name="cause"
              rows={3}
              maxLength={CAUSE_MAX}
              className="col-span-2"
              value={form.cause}
              onChange={(e) => set('cause', e.target.value)}
            />
          </div>
        </section>

        <div className="case-form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {t('cases.actions.cancel')}
          </button>
          <button type="submit" className="btn-primary" disabled={!canSubmit}>
            {saving ? t('cases.actions.saving') : t('cases.actions.save')}
          </button>
        </div>
      </form>

      {confirmDelete && (
        <ConfirmModal
          title={t('cases.actions.delete')}
          message={t('cases.deleteConfirm')}
          onClose={() => setConfirmDelete(false)}
          actions={[
            {
              label: t('cases.actions.cancel'),
              onClick: () => setConfirmDelete(false),
              variant: 'secondary',
            },
            {
              label: t('cases.actions.delete'),
              onClick: () => {
                setConfirmDelete(false)
                onDelete!(caseItem!.id)
              },
              variant: 'primary',
            },
          ]}
        />
      )}
    </div>
  )
}
