import { useState, useEffect, useCallback } from 'react'
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
import InputField from '../FormField/InputField'
import SelectField from '../FormField/SelectField'
import TextareaField from '../FormField/TextareaField'
import './TaskForm.css'

/** Context passed by parent tabs to pre-fill and optionally lock associations. */
export interface TaskFormContext {
  /** When set, the client is pre-selected and locked (cannot be changed). */
  lockedClientId?:   string
  lockedClientName?: string
  /** When set, the sale is also pre-selected and locked. Implies lockedClientId is set too. */
  lockedSaleId?:     string
  lockedSaleName?:   string
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
  // Provider
  providerName:        string
  providerPhone:       string
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
  providerName:       '',
  providerPhone:      '',
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
    clientId:           ctx?.lockedClientId ?? task.clientId ?? '',
    saleId:             ctx?.lockedSaleId   ?? task.saleId   ?? '',
    caseId:             task.caseId   ?? '',
    providerName:       task.providerName  ?? '',
    providerPhone:      task.providerPhone ?? '',
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
    clientId: ctx?.lockedClientId ?? '',
    saleId:   ctx?.lockedSaleId   ?? '',
  }
}

export default function TaskForm({ initial, users, context, onSubmit, onSave, onCancel }: Props) {
  const { t } = useTranslation()

  const [form, setForm]     = useState<FormState>(() => initialState(initial, context))
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  // Association dropdown data
  const [clients, setClients] = useState<Client[]>([])
  const [sales,   setSales]   = useState<Sale[]>([])
  const [cases,   setCases]   = useState<Case[]>([])

  const clientLocked = Boolean(context?.lockedClientId)
  const saleLocked   = Boolean(context?.lockedSaleId)

  // ── Load clients (only in standalone mode — no locked client) ──────────────
  useEffect(() => {
    if (clientLocked) return
    getClients()
      .then(setClients)
      .catch(() => {/* non-critical */})
  }, [clientLocked])

  // ── Load sales whenever clientId changes ───────────────────────────────────
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

  // ── Reset form when initial changes ───────────────────────────────────────
  useEffect(() => {
    setForm(initialState(initial, context))
    setError(null)
  }, [initial]) // eslint-disable-line react-hooks/exhaustive-deps

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleClientChange(newClientId: string) {
    setForm((prev) => ({
      ...prev,
      clientId: newClientId,
      saleId:   '',
      caseId:   '',
    }))
  }

  function handleSaleChange(newSaleId: string) {
    setForm((prev) => ({ ...prev, saleId: newSaleId, caseId: '' }))
  }

  function handleCaseChange(newCaseId: string) {
    // If a case is selected, auto-fill saleId from the case record
    const found = cases.find((c) => c.id === newCaseId)
    setForm((prev) => ({
      ...prev,
      caseId: newCaseId,
      saleId: found?.saleId ?? prev.saleId,
    }))
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

    // Client is required
    if (!form.clientId) {
      setError(t('tasks.errors.clientRequired'))
      return
    }

    // Reminder cross-field validation
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
      clientId:    form.clientId || undefined,
      saleId:      form.saleId   || undefined,
      caseId:      form.caseId   || undefined,
      providerName:  form.providerName.trim()  || undefined,
      providerPhone: form.providerPhone.trim() || undefined,
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

  const isEditing = Boolean(initial)

  // Resolve display names for locked fields
  const lockedClientName = context?.lockedClientName
  const lockedSaleName   = context?.lockedSaleName

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

          {/* Client */}
          {clientLocked ? (
            <div className="task-form__locked-field">
              <span className="task-form__locked-label">{t('tasks.form.client')}</span>
              <span className="task-form__locked-value">{lockedClientName ?? form.clientId}</span>
            </div>
          ) : (
            <SelectField
              id="tf-client"
              label={t('tasks.form.client')}
              value={form.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              required
            >
              <option value="">— {t('tasks.form.clientNone')} —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </SelectField>
          )}

          {/* Sale (optional) — shown when client is selected */}
          {saleLocked ? (
            <div className="task-form__locked-field">
              <span className="task-form__locked-label">{t('tasks.form.sale')}</span>
              <span className="task-form__locked-value">{lockedSaleName ?? form.saleId}</span>
            </div>
          ) : form.clientId ? (
            <SelectField
              id="tf-sale"
              label={t('tasks.form.sale')}
              value={form.saleId}
              onChange={(e) => handleSaleChange(e.target.value)}
            >
              <option value="">— {t('tasks.form.saleNone')} —</option>
              {sales.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </SelectField>
          ) : null}

          {/* Case (optional) — shown when sale is selected */}
          {form.saleId ? (
            <SelectField
              id="tf-case"
              label={t('tasks.form.case')}
              value={form.caseId}
              onChange={(e) => handleCaseChange(e.target.value)}
            >
              <option value="">— {t('tasks.form.caseNone')} —</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </SelectField>
          ) : null}

          {/* ── Provider section ── */}
          <div className="task-form__section-divider">
            <span className="task-form__section-label">{t('tasks.form.provider')}</span>
          </div>

          <div className="task-form__row task-form__row--2col">
            <InputField
              id="tf-providerName"
              label={t('tasks.form.providerName')}
              value={form.providerName}
              onChange={(e) => set('providerName', e.target.value)}
              maxLength={255}
            />
            <InputField
              id="tf-providerPhone"
              label={t('tasks.form.providerPhone')}
              value={form.providerPhone}
              onChange={(e) => set('providerPhone', e.target.value)}
              maxLength={50}
            />
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
              disabled={saving || !form.subject.trim() || !form.clientId}
            >
              {saving ? t('tasks.form.saving') : t('tasks.form.save')}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
