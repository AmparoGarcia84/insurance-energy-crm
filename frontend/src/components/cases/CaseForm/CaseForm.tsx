import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { createCase, updateCase, type Case, type CaseInput, type CaseStatus } from '../../../api/cases'
import { useClients } from '../../../context/DataContext'
import { usePermissions } from '../../../hooks/usePermissions'
import InputField from '../../shared/FormField/InputField'
import SelectField from '../../shared/FormField/SelectField'
import TextareaField from '../../shared/FormField/TextareaField'
import SearchableSelectField from '../../shared/FormField/SearchableSelectField'
import ConfirmModal from '../../shared/ConfirmModal/ConfirmModal'
import './CaseForm.css'

const STATUSES: CaseStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

interface FormState {
  clientId: string
  title: string
  description: string
  status: CaseStatus
}

const EMPTY: FormState = {
  clientId:    '',
  title:       '',
  description: '',
  status:      'OPEN',
}

function toFormState(c: Case): FormState {
  return {
    clientId:    c.clientId,
    title:       c.title,
    description: c.description ?? '',
    status:      c.status,
  }
}

interface Props {
  case: Case | null
  onSave:   (saved: Case) => void
  onCancel: () => void
  onDelete?: (id: string) => void
}

export default function CaseForm({ case: caseItem, onSave, onCancel, onDelete }: Props) {
  const { t } = useTranslation()
  const isNew = caseItem === null
  const { canDelete } = usePermissions()
  const { clients, loading: clientsLoading } = useClients()

  const [form, setForm] = useState<FormState>(() =>
    caseItem ? toFormState(caseItem) : EMPTY
  )
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.name })),
    [clients]
  )

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const input: CaseInput = {
        clientId:    form.clientId,
        title:       form.title,
        description: form.description || undefined,
        status:      form.status,
      }
      const saved = isNew
        ? await createCase(input)
        : await updateCase(caseItem.id, input)
      onSave(saved)
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = !!form.clientId && !!form.title.trim() && !saving

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
              onChange={(val) => set('clientId', val)}
            />
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
            <InputField
              id="case-title"
              label={`${t('cases.fields.title')} *`}
              name="title"
              type="text"
              autoComplete="off"
              required
              className="col-span-2"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>
        </section>

        <section className="form-section">
          <h2 className="form-section-title">{t('cases.sections.description')}</h2>
          <TextareaField
            id="case-description"
            label={t('cases.fields.description')}
            name="description"
            rows={5}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
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
