import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { TaskStatus, TaskPriority, type TaskWithRelations } from '../../../api/tasks'

// ── Status options shown in the inline selector ───────────────────────────────

const ALL_STATUSES: TaskStatus[] = [
  TaskStatus.NOT_STARTED,
  TaskStatus.IN_PROGRESS,
  TaskStatus.WAITING_FOR_INPUT,
  TaskStatus.DEFERRED,
  TaskStatus.COMPLETED,
  TaskStatus.UNLOGGED,
]

// ── Priority CSS map ──────────────────────────────────────────────────────────

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  [TaskPriority.LOWEST]:  'tt-priority--lowest',
  [TaskPriority.LOW]:     'tt-priority--low',
  [TaskPriority.NORMAL]:  'tt-priority--normal',
  [TaskPriority.HIGH]:    'tt-priority--high',
  [TaskPriority.HIGHEST]: 'tt-priority--highest',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isOverdue(task: TaskWithRelations): boolean {
  if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false
  return new Date(task.dueDate) < new Date()
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface TaskTableProps {
  tasks:          TaskWithRelations[]
  canDelete:      boolean
  /** Show the client name column — useful in global views where tasks span multiple clients */
  showClient?:    boolean
  onStatusChange: (task: TaskWithRelations, newStatus: TaskStatus) => void
  onEdit:         (task: TaskWithRelations) => void
  onDelete:       (task: TaskWithRelations) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TaskTable({
  tasks,
  canDelete,
  showClient = false,
  onStatusChange,
  onEdit,
  onDelete,
}: TaskTableProps) {
  const { t } = useTranslation()

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>{t('tasks.form.subject')}</th>
            {showClient && <th>{t('clients.detail.title')}</th>}
            <th>{t('tasks.form.status')}</th>
            <th>{t('tasks.form.priority')}</th>
            <th>{t('tasks.form.dueDate')}</th>
            <th>{t('tasks.form.assignedTo')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const overdue = isOverdue(task)
            const done    = task.status === TaskStatus.COMPLETED
            return (
              <tr key={task.id}>
                <td>
                  <span className={[
                    'tt-subject',
                    done    ? 'tt-subject--done'    : '',
                    overdue ? 'tt-subject--overdue' : '',
                  ].filter(Boolean).join(' ')}>
                    {task.subject}
                  </span>
                </td>
                {showClient && (
                  <td className="tt-client">
                    {task.client?.name ?? '—'}
                  </td>
                )}
                <td>
                  <select
                    className="tt-status-select"
                    value={task.status}
                    onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
                    aria-label={t('tasks.form.status')}
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{t(`tasks.status.${s}`)}</option>
                    ))}
                  </select>
                </td>
                <td>
                  {task.priority ? (
                    <span className={`tt-priority ${PRIORITY_CLASS[task.priority]}`}>
                      {t(`tasks.priority.${task.priority}`)}
                    </span>
                  ) : '—'}
                </td>
                <td className={`tt-date${overdue ? ' tt-date--overdue' : ''}`}>
                  {formatDate(task.dueDate)}
                </td>
                <td className="tt-assigned">
                  {task.assignedTo?.displayName ?? '—'}
                </td>
                <td className="tt-actions">
                  <button
                    className="icon-btn"
                    onClick={() => onEdit(task)}
                    title={t('tasks.actions.edit')}
                  >
                    <Pencil size={13} />
                  </button>
                  {canDelete && (
                    <button
                      className="icon-btn icon-btn-danger"
                      onClick={() => onDelete(task)}
                      title={t('tasks.actions.delete')}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
