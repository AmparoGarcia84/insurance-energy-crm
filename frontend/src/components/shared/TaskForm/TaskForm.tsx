import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import {
  TaskStatus,
  TaskPriority,
  ReminderChannel,
  ReminderRecurrence,
  type TaskWithRelations,
  type TaskPayload,
} from '../../../api/tasks'
import type { AuthUser } from '../../../api/auth'
import { getClients, type Client } from '../../../api/clients'
import { getSales } from '../../../api/sales'
import type { Sale } from '@crm/shared'
import { getCases, type Case } from '../../../api/cases'
import { getSuppliers, type Supplier } from '../../../api/suppliers'
import InputField from '../FormField/InputField'
import SelectField from '../FormField/SelectField'
import SearchableSelectField from '../FormField/SearchableSelectField'
import TextareaField from '../FormField/TextareaField'
import './TaskForm.css'

/** Context passed by parent tabs to pre-fill and optionally lock associations. */
export interface TaskFormContext {
  /** When set, the client is pre-selected and locked (cannot be changed). */
  lockedClientId?:    string
  lockedClientName?:  string
  /** When set, the sale is also pre-selected and locked. Implies lockedClientId is set too. */
  lockedSaleId?:      string
  lockedSaleName?:    string
  /** When set, the task is linked to a supplier (mutually exclusive with client context). */
  lockedSupplierId?:  string
  lockedSupplierName?: string
}

interface Props {
  /** Task to edit; null/undefined for a new task. */
  initial?:  TaskWithRelations | null
  /** Available users for the "Assigned to" selector. */
  users:     AuthUser[]
  /** Context from the parent tab — pre-fills and optionally locks association fields. */
  context?:  TaskFormContext
  onSubmit:  (data: TaskPayload) => Promise<TaskWithRelations>
  onSave:    (task: TaskWithRelations) => void
  onCancel:  () => void
}

const ALL_STATUSES     = Object.values(TaskStatus)
const ALL_PRIORITIES   = Object.values(TaskPriority)
const ALL_CHANNELS     = Object.values(ReminderChannel)
const ALL_RECURRENCES  = Object.values(ReminderRecurrence)

interface FormState {
  subject:             string
  description:         string
  status:              TaskStatus
  priority:            TaskPriority | ''
  dueDate:             string
  assignedToUserId:    string
  // Association
  clientId:            string
  saleId:              string
  caseId:              string
  supplierId:          string
  // Provider
  providerSupplierId:  string
  // Reminder
  hasReminder:         boolean
  reminderAt:          string
  reminderChannel:     ReminderChannel | ''
  reminderRecurrence:  ReminderRecurrence | ''
}

const EMPTY: FormState = {
  subject:            '',
  description:        '',
  status:             TaskStatus.NOT_STARTED,
  priority:           '',
  dueDate:            '',
  assignedToUserId:   '',
  clientId:           '',
  saleId:             '',
  caseId:             '',
  supplierId:         '',
  providerSupplierId: '',
  hasReminder:        false,
  reminderAt:         '',
  reminderChannel:    '',
  reminderRecurrence: '',
}

function toDatetimeLocal(iso: string): string {
  return iso.slice(0, 16)
}

function fromTask(task: TaskWithRelations, ctx?: TaskFormContext): FormState {
  return {
    subject:            task.subject,
    description:        task.description ?? '',
    status:             task.status,
    priority:           task.priority ?? '',
    dueDate:            task.dueDate ? task.dueDate.slice(0, 10) : '',
    assignedToUserId:   task.assignedToUserId ?? '',
    clientId:           ctx?.lockedClientId   ?? task.clientId   ?? '',
    saleId:             ctx?.lockedSaleId     ?? task.saleId     ?? '',
    caseId:             task.caseId           ?? '',
    supplierId:         ctx?.lockedSupplierId ?? task.supplierId ?? '',
    providerSupplierId: task.providerSupplierId ?? '',
    hasReminder:        task.hasReminder,
    reminderAt:         task.reminderAt ? toDatetimeLocal(task.reminderAt) : '',
    reminderChannel:    task.reminderChannel ?? '',
    reminderRecurrence: task.reminderRecurrence ?? '',
  }
}

function initialState(initial: TaskWithRelations | null | undefined, ctx?: TaskFormContext): FormState {
  if (initial) return fromTask(initial, ctx)
  return {
    ...EMPTY,
    clientId:   ctx?.lockedClientId   ?? '',
    saleId:     ctx?.lockedSaleId     ?? '',
    supplierId: ctx?.lockedSupplierId ?? '',
  }
}

// ── Client option helpers ─────────────────────────────────────────────────────

function formatClientOption(client: { name: string; clientNumber?: string; nif?: string }): string {
  const suffix = [client.clientNumber ? `#${client.clientNumber}` : '', client.nif ?? '']
    .filter(Boolean)
    .join(' · ')
  return suffix ? `${client.name} (${suffix})` : client.name
}

function formatSupplierOption(supplier: { name: string; cif?: string }): string {
  return supplier.cif ? `${supplier.name} (${supplier.cif})` : supplier.name
}

function renderHighlighted(text: string, query: string): ReactNode {
  const trimmed = query.trim()
  if (!trimmed) return text
  const lower  = text.toLowerCase()
  const lowerQ = trimmed.toLowerCase()
  const idx = lower.indexOf(lowerQ)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="task-form__client-highlight">
        {text.slice(idx, idx + trimmed.length)}
      </mark>
      {text.slice(idx + trimmed.length)}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function TaskForm({ initial, users, context, onSubmit, onSave, onCancel }: Props) {
  const { t } = useTranslation()

  const [form, setForm]     = useState<FormState>(() => initialState(initial, context))
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  // Association dropdown data
  const [clients,   setClients]   = useState<Client[]>([])
  const [sales,     setSales]     = useState<Sale[]>([])
  const [cases,     setCases]     = useState<Case[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  // Client combobox state
  const [clientQuery, setClientQuery]             = useState<string>(context?.lockedClientName ?? '')
  const [showClientOptions, setShowClientOptions] = useState(false)

  // Provider supplier combobox state
  const [providerQuery, setProviderQuery]               = useState<string>('')
  const [showProviderOptions, setShowProviderOptions]   = useState(false)

  const clientLocked   = Boolean(context?.lockedClientId)
  const saleLocked     = Boolean(context?.lockedSaleId)
  const supplierLocked = Boolean(context?.lockedSupplierId)

  // ── Load clients (only when not locked) ──────────────────────────────────
  useEffect(() => {
    if (clientLocked) return
    getClients()
      .then(setClients)
      .catch(() => {/* non-critical */})
  }, [clientLocked])

  // When editing an existing task, initialise the client query once the list loads
  useEffect(() => {
    if (clientLocked || clientQuery || !form.clientId) return
    const found = clients.find((c) => c.id === form.clientId)
    if (found) setClientQuery(found.name)
  }, [clients]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filtered clients for the combobox ─────────────────────────────────────
  const filteredClients = useMemo(() => {
    const query = clientQuery.trim().toLowerCase()
    if (!query) return clients.slice(0, 20)
    return clients
      .filter((client) => {
        const searchable = [client.name, client.clientNumber ?? '', client.nif ?? '']
          .join(' ')
          .toLowerCase()
        return searchable.includes(query)
      })
      .slice(0, 20)
  }, [clients, clientQuery])

  // ── Load all suppliers for the provider combobox ──────────────────────────
  useEffect(() => {
    getSuppliers()
      .then(setSuppliers)
      .catch(() => {/* non-critical */})
  }, [])

  // When editing a task with providerSupplierId, initialise the provider query once list loads
  useEffect(() => {
    if (providerQuery || !form.providerSupplierId) return
    const found = suppliers.find((s) => s.id === form.providerSupplierId)
    if (found) setProviderQuery(found.name)
  }, [suppliers]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filtered suppliers for the provider combobox ─────────────────────────
  const filteredProviders = useMemo(() => {
    const query = providerQuery.trim().toLowerCase()
    if (!query) return suppliers.slice(0, 20)
    return suppliers
      .filter((s) => {
        const searchable = [s.name, s.cif ?? ''].join(' ').toLowerCase()
        return searchable.includes(query)
      })
      .slice(0, 20)
  }, [suppliers, providerQuery])

  // ── Load sales whenever clientId changes ──────────────────────────────────
  const loadSales = useCallback((clientId: string) => {
    if (!clientId) { setSales([]); return }
    getSales({ clientId })
      .then(setSales)
      .catch(() => { setSales([]) })
  }, [])

  useEffect(() => {
    loadSales(form.clientId)
  }, [form.clientId, loadSales])

  // ── Load cases whenever saleId changes ────────────────────────────────────
  const loadCases = useCallback((saleId: string) => {
    if (!saleId) { setCases([]); return }
    getCases({ saleId })
      .then(setCases)
      .catch(() => { setCases([]) })
  }, [])

  useEffect(() => {
    loadCases(form.saleId)
  }, [form.saleId, loadCases])

  // ── Reset form when initial changes ──────────────────────────────────────
  useEffect(() => {
    setForm(initialState(initial, context))
    setError(null)
  }, [initial]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ───────────────────────────────────────────────────────────────

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleClientChange(newClientId: string) {
    setForm((prev) => ({ ...prev, clientId: newClientId, saleId: '', caseId: '' }))
  }

  function handleSaleChange(newSaleId: string) {
    setForm((prev) => ({ ...prev, saleId: newSaleId, caseId: '' }))
  }

  function handleCaseChange(newCaseId: string) {
    const found = cases.find((c) => c.id === newCaseId)
    setForm((prev) => ({
      ...prev,
      caseId: newCaseId,
      saleId: found?.saleId ?? prev.saleId,
    }))
  }

  function selectClient(clientId: string) {
    const selected = clients.find((c) => c.id === clientId)
    if (!selected) return
    handleClientChange(clientId)
    setClientQuery(selected.name)
    setShowClientOptions(false)
  }

  function selectProvider(supplierId: string) {
    const selected = suppliers.find((s) => s.id === supplierId)
    if (!selected) return
    set('providerSupplierId', supplierId)
    setProviderQuery(selected.name)
    setShowProviderOptions(false)
  }

  function handleReminderToggle(checked: boolean) {
    setForm((prev) => ({
      ...prev,
      hasReminder:        checked,
      reminderAt:         checked ? prev.reminderAt : '',
      reminderChannel:    checked ? prev.reminderChannel : '',
      reminderRecurrence: checked ? prev.reminderRecurrence : '',
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.subject.trim()) return

    if (!form.clientId && !form.supplierId) {
      setError(t('tasks.errors.clientRequired'))
      return
    }

    if (form.hasReminder && !form.reminderAt) {
      setError(t('tasks.errors.reminderAtRequired'))
      return
    }
    if (form.hasReminder && !form.reminderChannel) {
      setError(t('tasks.errors.reminderChannelRequired'))
      return
    }

    const payload: TaskPayload = {
      subject:     form.subject.trim(),
      description: form.description.trim() || undefined,
      status:      form.status,
      priority:    form.priority  || undefined,
      dueDate:     form.dueDate   || null,
      assignedToUserId: form.assignedToUserId || undefined,
      clientId:           form.clientId           || undefined,
      saleId:             form.saleId             || undefined,
      caseId:             form.caseId             || undefined,
      supplierId:         form.supplierId         || undefined,
      providerSupplierId: form.providerSupplierId || undefined,
      hasReminder: form.hasReminder,
      reminderAt:         form.hasReminder && form.reminderAt
        ? new Date(form.reminderAt).toISOString()
        : null,
      reminderChannel:    form.hasReminder && form.reminderChannel
        ? form.reminderChannel
        : undefined,
      reminderRecurrence: form.hasReminder && form.reminderRecurrence
        ? form.reminderRecurrence
        : undefined,
    }

    setSaving(true)
    setError(null)
    try {
      const saved = await onSubmit(payload)
      onSave(saved)
    } catch {
      setError(t('common.saveError') ?? 'Error saving task')
    } finally {
      setSaving(false)
    }
  }

  const isEditing          = Boolean(initial)
  const lockedClientName   = context?.lockedClientName
  const lockedSaleName     = context?.lockedSaleName
  const lockedSupplierName = context?.lockedSupplierName

  const saleOptions = sales.map((s) => ({ value: s.id, label: s.title }))
  const caseOptions = cases.map((c) => ({ value: c.id, label: c.title }))

  return (
    <div className="task-form-view">

      {/* ── Header ── */}
      <div className="task-form-view__header">
        <button
          type="button"
          className="icon-btn task-form-view__back"
          onClick={onCancel}
          aria-label={t('tasks.form.cancel')}
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="task-form-view__title">
          {isEditing ? t('tasks.form.titleEdit') : t('tasks.form.titleNew')}
        </h2>
      </div>

      {/* ── Form ── */}
      <div className="section-card task-form-view__card">
        <form className="task-form" onSubmit={handleSubmit} noValidate>

          {/* Subject */}
          <InputField
            id="tf-subject"
            label={t('tasks.form.subject')}
            value={form.subject}
            onChange={(e) => set('subject', e.target.value)}
            required
            maxLength={255}
          />

          {/* Description */}
          <TextareaField
            id="tf-description"
            label={t('tasks.form.description')}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
          />

          {/* Status / Priority / Due date */}
          <div className="task-form__row">
            <SelectField
              id="tf-status"
              label={t('tasks.form.status')}
              value={form.status}
              onChange={(e) => set('status', e.target.value as TaskStatus)}
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{t(`tasks.status.${s}`)}</option>
              ))}
            </SelectField>

            <SelectField
              id="tf-priority"
              label={t('tasks.form.priority')}
              value={form.priority}
              onChange={(e) => set('priority', e.target.value as TaskPriority | '')}
            >
              <option value="">—</option>
              {ALL_PRIORITIES.map((p) => (
                <option key={p} value={p}>{t(`tasks.priority.${p}`)}</option>
              ))}
            </SelectField>

            <InputField
              id="tf-dueDate"
              label={t('tasks.form.dueDate')}
              type="date"
              value={form.dueDate}
              onChange={(e) => set('dueDate', e.target.value)}
            />
          </div>

          {/* Assigned to */}
          {users.length > 0 && (
            <SelectField
              id="tf-assignedTo"
              label={t('tasks.form.assignedTo')}
              value={form.assignedToUserId}
              onChange={(e) => set('assignedToUserId', e.target.value)}
            >
              <option value="">{t('tasks.form.assignedToNone')}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.displayName}</option>
              ))}
            </SelectField>
          )}

          {/* ── Association section ── */}
          <div className="task-form__section-divider">
            <span className="task-form__section-label">{t('tasks.form.association')}</span>
          </div>

          {/* Supplier locked */}
          {supplierLocked && (
            <div className="task-form__locked-field">
              <span className="task-form__locked-label">{t('nav.suppliers')}</span>
              <span className="task-form__locked-value">{lockedSupplierName ?? form.supplierId}</span>
            </div>
          )}

          {/* Client / Sale / Case — always in the same 3-column row */}
          {!supplierLocked && (
            <div className="task-form__row">

              {/* ── Client ── */}
              {clientLocked ? (
                <InputField
                  id="tf-client-locked"
                  label={t('tasks.form.client')}
                  value={lockedClientName ?? form.clientId}
                  disabled
                  readOnly
                />
              ) : (
                <div className="form-field task-form__client-field">
                  <label htmlFor="tf-client-query">{t('tasks.form.client')}</label>
                  <input
                    id="tf-client-query"
                    type="text"
                    autoComplete="off"
                    value={clientQuery}
                    placeholder={t('common.searchOptions')}
                    onFocus={() => setShowClientOptions(true)}
                    onBlur={() => setTimeout(() => setShowClientOptions(false), 150)}
                    onChange={(e) => {
                      setClientQuery(e.target.value)
                      if (form.clientId) handleClientChange('')
                      setShowClientOptions(true)
                    }}
                  />
                  {showClientOptions && clients.length > 0 && (
                    <div className="task-form__client-options">
                      {filteredClients.length === 0 ? (
                        <div className="task-form__client-option task-form__client-option--status">
                          {t('common.noResults')}
                        </div>
                      ) : (
                        filteredClients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            className="task-form__client-option"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              selectClient(client.id)
                            }}
                          >
                            {renderHighlighted(formatClientOption(client), clientQuery)}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Sale ── */}
              {saleLocked ? (
                <InputField
                  id="tf-sale-locked"
                  label={t('tasks.form.sale')}
                  value={lockedSaleName ?? form.saleId}
                  disabled
                  readOnly
                />
              ) : (
                <SearchableSelectField
                  id="tf-sale"
                  label={t('tasks.form.sale')}
                  name="tf-sale"
                  value={form.saleId}
                  options={saleOptions}
                  emptyLabel={`— ${t('tasks.form.saleNone')} —`}
                  searchPlaceholder={t('common.searchOptions')}
                  noResultsLabel={t('common.noResults')}
                  onChange={handleSaleChange}
                  disabled={!form.clientId}
                />
              )}

              {/* ── Case ── */}
              <SearchableSelectField
                id="tf-case"
                label={t('tasks.form.case')}
                name="tf-case"
                value={form.caseId}
                options={caseOptions}
                emptyLabel={`— ${t('tasks.form.caseNone')} —`}
                searchPlaceholder={t('common.searchOptions')}
                noResultsLabel={t('common.noResults')}
                onChange={handleCaseChange}
                disabled={!form.saleId}
              />

            </div>
          )}

          {/* ── Provider section ── */}
          <div className="task-form__section-divider">
            <span className="task-form__section-label">{t('tasks.form.provider')}</span>
          </div>

          <div className="form-field task-form__client-field">
            <label htmlFor="tf-provider-query">{t('tasks.form.providerSupplier')}</label>
            <input
              id="tf-provider-query"
              type="text"
              autoComplete="off"
              value={providerQuery}
              placeholder={t('common.searchOptions')}
              onFocus={() => setShowProviderOptions(true)}
              onBlur={() => setTimeout(() => setShowProviderOptions(false), 150)}
              onChange={(e) => {
                setProviderQuery(e.target.value)
                if (form.providerSupplierId) set('providerSupplierId', '')
                setShowProviderOptions(true)
              }}
            />
            {showProviderOptions && suppliers.length > 0 && (
              <div className="task-form__client-options">
                {filteredProviders.length === 0 ? (
                  <div className="task-form__client-option task-form__client-option--status">
                    {t('common.noResults')}
                  </div>
                ) : (
                  filteredProviders.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="task-form__client-option"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        selectProvider(s.id)
                      }}
                    >
                      {renderHighlighted(formatSupplierOption(s), providerQuery)}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ── Reminder section ── */}
          <div className="task-form__reminder-toggle">
            <label className="task-form__checkbox-label">
              <input
                type="checkbox"
                id="tf-hasReminder"
                checked={form.hasReminder}
                onChange={(e) => handleReminderToggle(e.target.checked)}
              />
              {t('tasks.form.reminder')}
            </label>
          </div>

          {form.hasReminder && (
            <div className="task-form__reminder-fields">
              <InputField
                id="tf-reminderAt"
                label={t('tasks.form.reminderAt')}
                type="datetime-local"
                value={form.reminderAt}
                onChange={(e) => set('reminderAt', e.target.value)}
                required
              />

              <div className="task-form__row">
                <SelectField
                  id="tf-reminderChannel"
                  label={t('tasks.form.reminderChannel')}
                  value={form.reminderChannel}
                  onChange={(e) => set('reminderChannel', e.target.value as ReminderChannel | '')}
                  required
                >
                  <option value="">—</option>
                  {ALL_CHANNELS.map((c) => (
                    <option key={c} value={c}>{t(`tasks.reminderChannel.${c}`)}</option>
                  ))}
                </SelectField>

                <SelectField
                  id="tf-reminderRecurrence"
                  label={t('tasks.form.reminderRecurrence')}
                  value={form.reminderRecurrence}
                  onChange={(e) => set('reminderRecurrence', e.target.value as ReminderRecurrence | '')}
                >
                  <option value="">—</option>
                  {ALL_RECURRENCES.map((r) => (
                    <option key={r} value={r}>{t(`tasks.reminderRecurrence.${r}`)}</option>
                  ))}
                </SelectField>
              </div>
            </div>
          )}

          {error && <p className="task-form__error">{error}</p>}

          {/* ── Actions ── */}
          <div className="task-form__actions">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
              {t('tasks.form.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving || !form.subject.trim() || (!form.clientId && !form.supplierId)}
            >
              {saving ? t('tasks.form.saving') : t('tasks.form.save')}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
