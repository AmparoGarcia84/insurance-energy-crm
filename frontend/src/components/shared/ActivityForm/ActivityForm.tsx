import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityType, ActivityDirection } from '@crm/shared'
import type { ActivityWithRelations, ActivityPayload } from '../../../api/activities'
import { CLIENT_ACTIVITY_TYPES } from '../../../api/activities'
import InputField from '../FormField/InputField'
import SelectField from '../FormField/SelectField'
import TextareaField from '../FormField/TextareaField'
import './ActivityForm.css'

interface Props {
  clientId:   string
  initial?:   ActivityWithRelations
  onSave:     (activity: ActivityWithRelations) => void
  onCancel:   () => void
  onSubmit:   (data: ActivityPayload) => Promise<ActivityWithRelations>
}

function toDatetimeLocal(iso: string): string {
  // Converts ISO string to value accepted by <input type="datetime-local">
  return iso.slice(0, 16)
}

function toISOString(datetimeLocal: string): string {
  return new Date(datetimeLocal).toISOString()
}

function nowDatetimeLocal(): string {
  return toDatetimeLocal(new Date().toISOString())
}

export default function ActivityForm({ clientId, initial, onSave, onCancel, onSubmit }: Props) {
  const { t } = useTranslation()

  const [type, setType]             = useState<ActivityType>(initial?.type ?? ActivityType.CALL)
  const [direction, setDirection]   = useState<ActivityDirection | ''>(initial?.direction ?? '')
  const [subject, setSubject]       = useState(initial?.subject ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [outcome, setOutcome]       = useState(initial?.outcome ?? '')
  const [nextStep, setNextStep]     = useState(initial?.nextStep ?? '')
  const [activityAt, setActivityAt] = useState(
    initial?.activityAt ? toDatetimeLocal(initial.activityAt) : nowDatetimeLocal()
  )
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim()) return

    const payload: ActivityPayload = {
      clientId,
      type,
      direction:   direction || undefined,
      subject:     subject.trim(),
      description: description.trim() || undefined,
      outcome:     outcome.trim()     || undefined,
      nextStep:    nextStep.trim()    || undefined,
      activityAt:  toISOString(activityAt),
    }
    if (initial?.saleId) payload.saleId = initial.saleId

    setSaving(true)
    setError(null)
    try {
      const saved = await onSubmit(payload)
      onSave(saved)
    } catch {
      setError('Error saving activity')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="activity-form" onSubmit={handleSubmit} noValidate>
      <div className="activity-form__row">
        <SelectField
          id="act-type"
          label={t('activities.form.type')}
          value={type}
          onChange={(e) => setType(e.target.value as ActivityType)}
          required
        >
          {CLIENT_ACTIVITY_TYPES.map((v) => (
            <option key={v} value={v}>{t(`activities.type.${v}`)}</option>
          ))}
        </SelectField>

        <SelectField
          id="act-direction"
          label={t('activities.form.direction')}
          value={direction}
          onChange={(e) => setDirection(e.target.value as ActivityDirection | '')}
        >
          <option value="">{t('clients.fields.none')}</option>
          {Object.values(ActivityDirection).map((v) => (
            <option key={v} value={v}>{t(`activities.direction.${v}`)}</option>
          ))}
        </SelectField>

        <InputField
          id="act-date"
          label={t('activities.form.activityAt')}
          type="datetime-local"
          value={activityAt}
          onChange={(e) => setActivityAt(e.target.value)}
          required
        />
      </div>

      <InputField
        id="act-subject"
        label={t('activities.form.subject')}
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
        maxLength={255}
      />

      <TextareaField
        id="act-description"
        label={t('activities.form.description')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />

      <div className="activity-form__row">
        <TextareaField
          id="act-outcome"
          label={t('activities.form.outcome')}
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          rows={2}
        />

        <TextareaField
          id="act-next-step"
          label={t('activities.form.nextStep')}
          value={nextStep}
          onChange={(e) => setNextStep(e.target.value)}
          rows={2}
        />
      </div>

      {error && <p className="activity-form__error">{error}</p>}

      <div className="activity-form__actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          {t('activities.form.cancel')}
        </button>
        <button type="submit" className="btn-primary" disabled={saving || !subject.trim()}>
          {saving ? t('activities.form.saving') : t('activities.form.save')}
        </button>
      </div>
    </form>
  )
}
