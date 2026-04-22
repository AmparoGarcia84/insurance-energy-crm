import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search } from 'lucide-react'
import type { ActivityWithRelations, ActivityPayload } from '../../../api/activities'
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../../../api/activities'
import { usePermissions } from '../../../hooks/usePermissions'
import ActivityForm from '../../shared/ActivityForm/ActivityForm'
import ActivityCard from '../../shared/ActivityCard/ActivityCard'
import ConfirmModal from '../../shared/ConfirmModal/ConfirmModal'
import './ClientActivityTab.css'

interface Props {
  clientId: string
}

export default function ClientActivityTab({ clientId }: Props) {
  const { t } = useTranslation()
  const { canDelete } = usePermissions()

  const [activities, setActivities]     = useState<ActivityWithRelations[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [showForm, setShowForm]         = useState(false)
  const [editing, setEditing]           = useState<ActivityWithRelations | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ActivityWithRelations | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    getActivities({ clientId })
      .then(setActivities)
      .catch(() => {/* non-critical */})
      .finally(() => setLoading(false))
  }, [clientId])

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
    if (editing) return updateActivity(editing.id, data)
    return createActivity(data)
  }

  async function handleDelete() {
    if (!confirmDelete) return
    await deleteActivity(confirmDelete.id)
    setActivities((prev) => prev.filter((a) => a.id !== confirmDelete.id))
    setConfirmDelete(null)
  }

  return (
    <div className="cat-view">

      {/* Toolbar */}
      <div className="cat-toolbar">
        <span className="cat-toolbar__count">
          {!loading && t('activities.recentCount', { count: activities.length })}
        </span>
        <button className="btn-primary" onClick={handleNew}>
          <Plus size={15} />
          {t('activities.newActivity')}
        </button>
      </div>

      {/* Search */}
      {!loading && activities.length > 0 && (
        <div className="table-search">
          <Search size={15} />
          <input
            type="search"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('activities.searchPlaceholder')}
          />
        </div>
      )}

      {/* Form panel */}
      {showForm && (
        <div className="cat-form-panel section-card">
          <h3 className="cat-form-title">
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

      {/* Activity list */}
      {loading ? null : filtered.length === 0 ? (
        <div className="cat-empty">
          <p>{search.trim() ? t('activities.emptySearch') : t('activities.noActivities')}</p>
        </div>
      ) : (
        <ul className="cat-list">
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
            { label: t('common.cancel'), onClick: () => setConfirmDelete(null), variant: 'secondary' },
            { label: t('activities.actions.delete'), onClick: handleDelete, variant: 'primary' },
          ]}
        />
      )}
    </div>
  )
}
