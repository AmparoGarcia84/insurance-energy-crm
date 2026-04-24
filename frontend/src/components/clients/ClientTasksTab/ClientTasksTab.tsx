import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search } from 'lucide-react'
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  TaskStatus,
  type TaskWithRelations,
  type TaskPayload,
} from '../../../api/tasks'
import { getClient } from '../../../api/clients'
import { getUsers } from '../../../api/users'
import type { AuthUser } from '../../../api/auth'
import { usePermissions } from '../../../hooks/usePermissions'
import TaskTable from '../../shared/TaskTable/TaskTable'
import TaskForm, { type TaskFormContext } from '../../shared/TaskForm/TaskForm'
import ConfirmModal from '../../shared/ConfirmModal/ConfirmModal'
import '../../shared/TaskTable/TaskTable.css'
import './ClientTasksTab.css'

interface Props {
  clientId:   string
  clientName: string
}

export default function ClientTasksTab({ clientId, clientName }: Props) {
  const { t }         = useTranslation()
  const { canDelete } = usePermissions()

  const [tasks, setTasks]                 = useState<TaskWithRelations[]>([])
  const [users, setUsers]                 = useState<AuthUser[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [editing, setEditing]             = useState<TaskWithRelations | null>(null)
  const [showForm, setShowForm]           = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<TaskWithRelations | null>(null)

  const context: TaskFormContext = {
    lockedClientId:   clientId,
    lockedClientName: clientName,
  }

  const load = useCallback(() => {
    setLoading(true)
    getTasks({ clientId })
      .then(setTasks)
      .catch(() => {/* non-critical */})
      .finally(() => setLoading(false))
  }, [clientId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => {/* non-critical */})
  }, [])

  // clientName may not always be passed by legacy callers; fetch as fallback
  useEffect(() => {
    if (!clientName) {
      getClient(clientId).catch(() => {/* non-critical */})
    }
  }, [clientId, clientName])

  const filtered = search.trim()
    ? tasks.filter((task) =>
        task.subject.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase())
      )
    : tasks

  function handleNew() {
    setEditing(null)
    setShowForm(true)
  }

  function handleEdit(task: TaskWithRelations) {
    setEditing(task)
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditing(null)
  }

  async function handleSubmit(data: TaskPayload): Promise<TaskWithRelations> {
    // clientId, saleId, caseId are now included in the payload from the form
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
    <div className="ctt-view">

      <div className="ctt-toolbar">
        <span className="ctt-toolbar__count">
          {!loading && t('tasks.count', { count: tasks.length })}
        </span>
        <button className="btn-primary" onClick={handleNew}>
          <Plus size={15} />
          {t('tasks.newTask')}
        </button>
      </div>

      {!loading && tasks.length > 0 && (
        <div className="table-search">
          <Search size={15} />
          <input
            type="search"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('tasks.searchPlaceholder')}
          />
        </div>
      )}

      {loading ? null : filtered.length === 0 ? (
        <div className="ctt-empty">
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
