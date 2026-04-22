import {
  Phone, Mail, MessageCircle, Video,
  ArrowRightLeft, FileText, Download, Plus, Pencil,
  type LucideIcon,
} from 'lucide-react'
import './ActivityListCard.css'

export interface ActivityItem {
  id: string
  type: string
  subject: string
  date: string       // ISO string
  /** Optional secondary context — client name, sale title, etc. */
  context?: string | null
}

interface Props {
  title: string
  items: ActivityItem[]
  emptyLabel: string
  /**
   * 'relative' → "hace 3 días" (default — for client-scoped views)
   * 'absolute' → "15 abr"     (for global views like Home)
   */
  dateFormat?: 'relative' | 'absolute'
  /** Extra class on the root section-card element */
  className?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACTIVITY_ICON: Record<string, LucideIcon> = {
  CALL:           Phone,
  EMAIL:          Mail,
  WHATSAPP_NOTE:  MessageCircle,
  MEETING:        Video,
  STAGE_CHANGED:  ArrowRightLeft,
  DOC_UPLOADED:   FileText,
  EXPORT:         Download,
  CREATED:        Plus,
  UPDATED:        Pencil,
}

export function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'ahora'
  if (mins < 60)  return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ayer'
  if (days < 30)  return `hace ${days} días`
  const months = Math.floor(days / 30)
  return months === 1 ? 'hace 1 mes' : `hace ${months} meses`
}

function absoluteDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ActivityListCard({ title, items, emptyLabel, dateFormat = 'relative', className }: Props) {
  return (
    <div className={`section-card alc${className ? ` ${className}` : ''}`}>
      <div className="alc__header">
        <h3 className="alc__title">{title}</h3>
      </div>

      {items.length === 0 ? (
        <p className="alc__empty">{emptyLabel}</p>
      ) : (
        <ul className="alc__list">
          {items.map(entry => {
            const Icon = ACTIVITY_ICON[entry.type] ?? Pencil
            const dateStr = dateFormat === 'relative'
              ? relativeDate(entry.date)
              : absoluteDate(entry.date)

            return (
              <li key={entry.id} className="alc__item">
                <span className="alc__icon" aria-hidden>
                  <Icon size={14} />
                </span>
                <span className="alc__body">
                  <span className="alc__subject">{entry.subject}</span>
                  {entry.context && (
                    <span className="alc__context"> · {entry.context}</span>
                  )}
                </span>
                <span className="alc__date">{dateStr}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
