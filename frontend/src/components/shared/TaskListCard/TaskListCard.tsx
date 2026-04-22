import { AlertCircle } from 'lucide-react'
import './TaskListCard.css'

export interface TaskItem {
  id: string
  subject: string
  priority: string
  dueDate: string | null
  /** Secondary line below subject — assignee name, client name, etc. */
  meta?: string | null
}

interface Props {
  title: string
  items: TaskItem[]
  emptyLabel: string
  /** Badge shown next to the title when there are items */
  count?: number
  /**
   * Text shown when a task has no dueDate.
   * If omitted, the due-date column is hidden for tasks without a date.
   */
  noDueDateLabel?: string
  /** Extra class on the root section-card element */
  className?: string
}

const PRIORITY_CLASS: Record<string, string> = {
  LOWEST:  'task-priority--lowest',
  LOW:     'task-priority--low',
  NORMAL:  'task-priority--normal',
  HIGH:    'task-priority--high',
  HIGHEST: 'task-priority--highest',
}

function isOverdue(iso: string | null): boolean {
  if (!iso) return false
  return new Date(iso) < new Date(new Date().toDateString())
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

export default function TaskListCard({ title, items, emptyLabel, count, noDueDateLabel, className }: Props) {
  return (
    <div className={`section-card tlc${className ? ` ${className}` : ''}`}>
      <div className="tlc__header">
        <h3 className="tlc__title">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className="tlc__badge">{count}</span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="tlc__empty">{emptyLabel}</p>
      ) : (
        <ul className="tlc__list">
          {items.map(task => {
            const overdue = isOverdue(task.dueDate)
            const showDue = task.dueDate != null || noDueDateLabel != null

            return (
              <li key={task.id} className="tlc__item">
                <span
                  className={`tlc__priority ${PRIORITY_CLASS[task.priority] ?? 'task-priority--normal'}`}
                  title={task.priority}
                />
                <span className="tlc__body">
                  <span className="tlc__subject">{task.subject}</span>
                  {task.meta && (
                    <span className="tlc__meta">{task.meta}</span>
                  )}
                </span>
                {showDue && (
                  <span className={`tlc__due${overdue ? ' tlc__due--overdue' : ''}`}>
                    {overdue && <AlertCircle size={11} />}
                    {task.dueDate ? formatDate(task.dueDate) : noDueDateLabel}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
