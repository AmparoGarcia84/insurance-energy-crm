import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Search, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react'
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  TaskStatus,
  TaskPriority,
  RelatedEntityType,
  type TaskWithRelations,
  type TaskPayload,
} from '../../../api/tasks'
import { getUsers } from '../../../api/users'
import type { AuthUser } from '../../../api/auth'
import { usePermissions } from '../../../hooks/usePermissions'
import TaskForm from '../../shared/TaskForm/TaskForm'
import ConfirmModal from '../../shared/ConfirmModal/ConfirmModal'
import './SaleTasksTab.css'

// ── Kanban configuration ─────────────────────────────────────────────────────

interface Props {
  saleId:   string
  clientId: string
}

const KANBAN_STATUSES: TaskStatus[] = [
  TaskStatus.NOT_STARTED,
  TaskStatus.IN_PROGRESS,
  TaskStatus.WAITING_FOR_INPUT,
  TaskStatus.DEFERRED,
  TaskStatus.COMPLETED,
  TaskStatus.UNLOGGED,
]

const COLUMN_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.NOT_STARTED]:       '#b8a79c',
  [TaskStatus.IN_PROGRESS]:       '#3498db',
  [TaskStatus.WAITING_FOR_INPUT]: '#f39c12',
  [TaskStatus.DEFERRED]:          '#9b59b6',
  [TaskStatus.COMPLETED]:         '#27ae60',
  [TaskStatus.UNLOGGED]:          '#95a5a6',
}

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  [TaskPriority.LOWEST]:  'stt-priority--lowest',
  [TaskPriority.LOW]:     'stt-priority--low',
  [TaskPriority.NORMAL]:  'stt-priority--normal',
  [TaskPriority.HIGH]:    'stt-priority--high',
  [TaskPriority.HIGHEST]: 'stt-priority--highest',
}

function formatDate(iso?: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isOverdue(task: TaskWithRelations): boolean {
  if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false
  return new Date(task.dueDate) < new Date()
}

// ── Draggable task card ──────────────────────────────────────────────────────

interface CardProps {
  task:       TaskWithRelations
  isDragging: boolean
  onEdit:     (task: TaskWithRelations) => void
  onDelete:   (task: TaskWithRelations) => void
  onToggle:   (task: TaskWithRelations) => void
  canDelete:  boolean
}

function TaskCard({ task, isDragging, onEdit, onDelete, onToggle, canDelete }: CardProps) {
  const { t } = useTranslation()
  const overdue = isOverdue(task)
  const done    = task.status === TaskStatus.COMPLETED

  return (
    <div className={`stt-card${isDragging ? ' stt-card--dragging' : ''}`}>
      <p className={`stt-card__subject${done ? ' stt-card__subject--done' : ''}`}>
        {task.subject}
      </p>

      <div className="stt-card__meta">
        {task.priority && (
          <span className={`stt-priority ${PRIORITY_CLASS[task.priority]}`}>
            {t(`tasks.priority.${task.priority}`)}
          </span>
        )}
        {task.dueDate && (
          <span className={`stt-due${overdue ? ' stt-due--overdue' : ''}`}>
            {formatDate(task.dueDate)}
          </span>
        )}
        {task.assignedTo && (
          <span className="stt-assigned">{task.assignedTo.displayName}</span>
        )}
      </div>

      <div className="stt-card__actions">
        <button
          className="icon-btn"
          onClick={(e) => { e.stopPropagation(); onToggle(task) }}
          title={done ? t('tasks.actions.reopen') : t('tasks.actions.complete')}
        >
          {done
            ? <CheckCircle2 size={14} className="stt-icon--done" />
            : <Circle size={14} />}
        </button>
        <button
          className="icon-btn"
          onClick={(e) => { e.stopPropagation(); onEdit(task) }}
          title={t('tasks.actions.edit')}
        >
          <Pencil size={13} />
        </button>
        {canDelete && (
          <button
            className="icon-btn icon-btn-danger"
            onClick={(e) => { e.stopPropagation(); onDelete(task) }}
            title={t('tasks.actions.delete')}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

function DraggableTaskCard(props: CardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:   props.task.id,
    data: { status: props.task.status },
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCard {...props} isDragging={isDragging} />
    </div>
  )
}

// ── Droppable kanban column ──────────────────────────────────────────────────

interface ColumnProps {
  status:    TaskStatus
  tasks:     TaskWithRelations[]
  onEdit:    (task: TaskWithRelations) => void
  onDelete:  (task: TaskWithRelations) => void
  onToggle:  (task: TaskWithRelations) => void
  canDelete: boolean
  draggingId: string | null
}

function KanbanColumn({ status, tasks, onEdit, onDelete, onToggle, canDelete, draggingId }: ColumnProps) {
  const { t }                       = useTranslation()
  const { setNodeRef, isOver }      = useDroppable({ id: status })
  const color                       = COLUMN_COLORS[status]

  return (
    <div
      ref={setNodeRef}
      className={`stt-column${isOver ? ' stt-column--over' : ''}`}
      style={{ '--column-color': color } as React.CSSProperties}
    >
      <div className="stt-column__header">
        <span className="stt-column__name">{t(`tasks.status.${status}`)}</span>
        <span className="stt-column__count">{tasks.length}</span>
      </div>

      <div className="stt-column__cards">
        {tasks.map((task) => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            isDragging={task.id === draggingId}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={onToggle}
            canDelete={canDelete}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function SaleTasksTab({ saleId, clientId }: Props) {
  const { t }         = useTranslation()
  const { canDelete } = usePermissions()

  const [tasks, setTasks]                 = useState<TaskWithRelations[]>([])
  const [users, setUsers]                 = useState<AuthUser[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [editing, setEditing]             = useState<TaskWithRelations | null>(null)
  const [showForm, setShowForm]           = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<TaskWithRelations | null>(null)
  const [draggingId, setDraggingId]       = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const load = useCallback(() => {
    setLoading(true)
    getTasks({ relatedEntityType: RelatedEntityType.SALE, relatedEntityId: saleId })
      .then(setTasks)
      .catch(() => {/* non-critical */})
      .finally(() => setLoading(false))
  }, [saleId])

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

  function columnTasks(status: TaskStatus): TaskWithRelations[] {
    return filtered.filter((t) => t.status === status)
  }

  // ── Form view ──────────────────────────────────────────────────────────────
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
    const payload: TaskPayload = {
      ...data,
      relatedEntityType: RelatedEntityType.SALE,
      relatedEntityId:   saleId,
      clientId,
    }
    if (editing) return updateTask(editing.id, payload)
    return createTask(payload)
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

  async function handleToggleComplete(task: TaskWithRelations) {
    const nextStatus = task.status === TaskStatus.COMPLETED
      ? TaskStatus.NOT_STARTED
      : TaskStatus.COMPLETED
    try {
      const updated = await updateTask(task.id, { status: nextStatus })
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch {/* non-critical */}
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

  // ── DnD handlers ──────────────────────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    setDraggingId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setDraggingId(null)

    if (!over) return
    const taskId    = active.id as string
    const newStatus = over.id as TaskStatus
    const task      = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))
    updateTask(taskId, { status: newStatus }).catch(() => {
      // Revert on failure
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t)))
    })
  }

  const draggingTask = draggingId ? tasks.find((t) => t.id === draggingId) : null

  // ── Form view (replaces board) ─────────────────────────────────────────────
  if (showForm) {
    return (
      <TaskForm
        initial={editing}
        users={users}
        onSubmit={handleSubmit}
        onSave={handleSaved}
        onCancel={handleCancel}
      />
    )
  }

  // ── Board view ─────────────────────────────────────────────────────────────
  return (
    <div className="stt-view">

      {/* Toolbar */}
      <div className="stt-toolbar">
        <div className="stt-toolbar__left">
          {!loading && (
            <div className="table-search stt-toolbar__search">
              <Search size={14} />
              <input
                type="search"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('tasks.searchPlaceholder')}
              />
            </div>
          )}
        </div>
        <button className="btn-primary" onClick={handleNew}>
          <Plus size={15} />
          {t('tasks.newTask')}
        </button>
      </div>

      {/* Kanban board */}
      {!loading && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="stt-board">
            {KANBAN_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={columnTasks(status)}
                onEdit={handleEdit}
                onDelete={(t) => setConfirmDelete(t)}
                onToggle={handleToggleComplete}
                canDelete={canDelete}
                draggingId={draggingId}
              />
            ))}
          </div>

          <DragOverlay>
            {draggingTask && (
              <div className="stt-card stt-card--overlay">
                <p className="stt-card__subject">{draggingTask.subject}</p>
                {draggingTask.priority && (
                  <div className="stt-card__meta">
                    <span className={`stt-priority ${PRIORITY_CLASS[draggingTask.priority]}`}>
                      {t(`tasks.priority.${draggingTask.priority}`)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {confirmDelete && (
        <ConfirmModal
          title={t('tasks.actions.delete')}
          message={t('tasks.deleteConfirm', { subject: confirmDelete.subject })}
          onClose={() => setConfirmDelete(null)}
          actions={[
            { label: t('common.cancel'),           onClick: () => setConfirmDelete(null), variant: 'secondary' },
            { label: t('tasks.actions.delete'),    onClick: handleDeleteConfirm,           variant: 'primary'   },
          ]}
        />
      )}
    </div>
  )
}
