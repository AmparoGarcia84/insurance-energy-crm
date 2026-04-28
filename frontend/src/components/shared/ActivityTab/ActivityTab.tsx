import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import BasicSearch from '../BasicSearch/BasicSearch'
import type { ActivityWithRelations, ActivityPayload } from '../../../api/activities'
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../../../api/activities'
import { usePermissions } from '../../../hooks/usePermissions'
import ActivityForm from '../ActivityForm/ActivityForm'
import ActivityCard from '../ActivityCard/ActivityCard'
import ConfirmModal from '../ConfirmModal/ConfirmModal'
import './ActivityTab.css'

interface Props {
  /** Always required — passed to ActivityForm so it can load the client context. */
  clientId:         string
  /** When provided, activities are filtered by saleId and new activities are linked to it. */
  saleId?:          string
  /** When provided, activities are filtered by caseId and new activities are linked to it. */
  caseId?:          string
  /** Open the new-activity form on first render (e.g. triggered from a header button). */
  openFormOnMount?: boolean
}

export default function ActivityTab({ clientId, saleId, caseId, openFormOnMount }: Props) {
  const { t }          = useTranslation()
  const { canDelete }  = usePermissions()

  const [activities, setActivities]       = useState<ActivityWithRelations[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [showForm, setShowForm]           = useState(openFormOnMount ?? false)
  const [editing, setEditing]             = useState<ActivityWithRelations | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ActivityWithRelations | null>(null)

  // Derive the most-specific filter: case > sale > client
  const load = useCallback(() => {
    setLoading(true)
    const filters = caseId ? { caseId } : saleId ? { saleId } : { clientId }
    getActivities(filters)
      .then(setActivities)
      .catch(() => {/* non-critical */})
      .finally(() => setLoading(false))
  }, [clientId, saleId, caseId])

  useEffect(() => { load() }, [load])

  const filtered = search.trim()
    ? activities.filter((a) =>
        a.subject.toLowerCase().includes(search.toLowerCase()) ||
        a.description?.toLowerCase().includes(search.toLowerCase()) ||
        a.outcome?.toLowerCase().includes(search.toLowerCase())
      )
    : activities

  function handleNew() {
    setEditing(null)
    setShowForm(true)
  }

  function handleEdit(activity: ActivityWithRelations) {
    setEditing(activity)
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditing(null)
  }

  function handleSaved(activity: ActivityWithRelations) {
    setActivities((prev) => {
      const exists = prev.find((a) => a.id === activity.id)
      if (exists) return prev.map((a) => (a.id === activity.id ? activity : a))
      return [activity, ...prev]
    })
    setShowForm(false)
    setEditing(null)
  }

  async function handleSubmit(data: ActivityPayload): Promise<ActivityWithRelations> {
    // Always inject the contextual IDs so activities are correctly linked
    const payload: ActivityPayload = {
      ...data,
      ...(saleId ? { saleId } : {}),
      ...(caseId ? { caseId } : {}),
    }
    if (editing) return updateActivity(editing.id, payload)
    return createActivity(payload)
  }

  async function handleDelete() {
    if (!confirmDelete) return
    await deleteActivity(confirmDelete.id)
    setActivities((prev) => prev.filter((a) => a.id !== confirmDelete.id))
    setConfirmDelete(null)
  }

  return (
    <div className="activity-tab">

      <div className="activity-tab__toolbar">
        <span className="activity-tab__count">
          {!loading && t('activities.recentCount', { count: activities.length })}
        </span>
        <button className="btn-primary" onClick={handleNew}>
          <Plus size={15} />
          {t('activities.newActivity')}
        </button>
      </div>

      {!loading && activities.length > 0 && (
        <BasicSearch
          value={search}
          onChange={setSearch}
          placeholder={t('activities.searchPlaceholder')}
        />
      )}

      {showForm && (
        <div className="activity-tab__form-panel section-card">
          <h3 className="activity-tab__form-title">
            {editing ? t('activities.form.titleEdit') : t('activities.form.titleNew')}
          </h3>
          <ActivityForm
            clientId={clientId}
            initial={editing ?? undefined}
            onSubmit={handleSubmit}
            onSave={handleSaved}
            onCancel={handleCancel}
          />
        </div>
      )}

      {loading ? null : filtered.length === 0 ? (
        <div className="activity-tab__empty">
          <p>{search.trim() ? t('activities.emptySearch') : t('activities.noActivities')}</p>
        </div>
      ) : (
        <ul className="activity-tab__list">
          {filtered.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              canDelete={canDelete}
              onEdit={handleEdit}
              onDelete={setConfirmDelete}
            />
          ))}
        </ul>
      )}

      {confirmDelete && (
        <ConfirmModal
          title={t('activities.actions.delete')}
          message={`"${confirmDelete.subject}"`}
          onClose={() => setConfirmDelete(null)}
          actions={[
            { label: t('common.cancel'),               onClick: () => setConfirmDelete(null), variant: 'secondary' },
            { label: t('activities.actions.delete'),   onClick: handleDelete,                 variant: 'primary'   },
          ]}
        />
      )}
    </div>
  )
}
