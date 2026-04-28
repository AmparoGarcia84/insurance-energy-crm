import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import BasicSearch from '../BasicSearch/BasicSearch'
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  TaskStatus,
  type TaskWithRelations,
  type TaskPayload,
} from '../../../api/tasks'
import { getUsers } from '../../../api/users'
import type { AuthUser } from '../../../api/auth'
import { usePermissions } from '../../../hooks/usePermissions'
import TaskTable from '../TaskTable/TaskTable'
import TaskForm, { type TaskFormContext } from '../TaskForm/TaskForm'
import ConfirmModal from '../ConfirmModal/ConfirmModal'
import '../TaskTable/TaskTable.css'
import './TasksTab.css'

interface Props {
  /**
   * Pre-fills and locks association fields in the task form.
   * Also drives which filter is used to load tasks:
   *   lockedCaseId  → filter by caseId
   *   lockedSaleId  → filter by saleId  (when no caseId)
   *   lockedClientId→ filter by clientId (when no sale or case)
   */
  context: TaskFormContext
}

export default function TasksTab({ context }: Props) {
  const { t }          = useTranslation()
  const { canDelete }  = usePermissions()

  const [tasks, setTasks]                 = useState<TaskWithRelations[]>([])
  const [users, setUsers]                 = useState<AuthUser[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [editing, setEditing]             = useState<TaskWithRelations | null>(null)
  const [showForm, setShowForm]           = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<TaskWithRelations | null>(null)

  // Derive the most-specific filter from context: case > sale > client
  const load = useCallback(() => {
    setLoading(true)
    const filters = context.lockedCaseId
      ? { caseId:   context.lockedCaseId }
      : context.lockedSaleId
        ? { saleId:  context.lockedSaleId }
        : { clientId: context.lockedClientId }
    getTasks(filters)
      .then(setTasks)
      .catch(() => {/* non-critical */})
      .finally(() => setLoading(false))
  }, [context.lockedClientId, context.lockedSaleId, context.lockedCaseId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => {/* non-critical */})
  }, [])

  const filtered = search.trim()
    ? tasks.filter((t) =>
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
      )
    : tasks

  function handleNew()  { setEditing(null); setShowForm(true) }
  function handleEdit(task: TaskWithRelations) { setEditing(task); setShowForm(true) }
  function handleCancel() { setShowForm(false); setEditing(null) }

  async function handleSubmit(data: TaskPayload): Promise<TaskWithRelations> {
    if (editing) return updateTask(editing.id, data)
    return createTask(data)
  }

  function handleSaved(task: TaskWithRelations) {
    setTasks((prev) => {
      const exists = prev.find((t) => t.id === task.id)
      if (exists) return prev.map((t) => (t.id === task.id ? task : t))
      return [task, ...prev]
    })
    setShowForm(false)
    setEditing(null)
  }

  function handleStatusChange(task: TaskWithRelations, newStatus: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)))
    updateTask(task.id, { status: newStatus }).catch(() => {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)))
    })
  }

  async function handleDeleteConfirm() {
    if (!confirmDelete) return
    try {
      await deleteTask(confirmDelete.id)
      setTasks((prev) => prev.filter((t) => t.id !== confirmDelete.id))
    } finally {
      setConfirmDelete(null)
    }
  }

  // ── Form view ──────────────────────────────────────────────────────────────

  if (showForm) {
    return (
      <TaskForm
        initial={editing}
        users={users}
        context={context}
        onSubmit={handleSubmit}
        onSave={handleSaved}
        onCancel={handleCancel}
      />
    )
  }

  // ── Table view ─────────────────────────────────────────────────────────────

  return (
    <div className="tasks-tab">

      <div className="tasks-tab__toolbar">
        <span className="tasks-tab__count">
          {!loading && t('tasks.count', { count: tasks.length })}
        </span>
        <button className="btn-primary" onClick={handleNew}>
          <Plus size={15} />
          {t('tasks.newTask')}
        </button>
      </div>

      {!loading && tasks.length > 0 && (
        <BasicSearch
          value={search}
          onChange={setSearch}
          placeholder={t('tasks.searchPlaceholder')}
        />
      )}

      {loading ? null : filtered.length === 0 ? (
        <div className="tasks-tab__empty">
          <p>{search.trim() ? t('tasks.emptySearch') : t('tasks.noTasks')}</p>
        </div>
      ) : (
        <TaskTable
          tasks={filtered}
          canDelete={canDelete}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={setConfirmDelete}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title={t('tasks.actions.delete')}
          message={t('tasks.deleteConfirm', { subject: confirmDelete.subject })}
          onClose={() => setConfirmDelete(null)}
          actions={[
            { label: t('common.cancel'),        onClick: () => setConfirmDelete(null), variant: 'secondary' },
            { label: t('tasks.actions.delete'), onClick: handleDeleteConfirm,          variant: 'primary'   },
          ]}
        />
      )}
    </div>
  )
}
