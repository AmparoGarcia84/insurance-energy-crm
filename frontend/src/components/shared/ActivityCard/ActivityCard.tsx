import { useTranslation } from 'react-i18next'
import {
  Phone, Mail, MessageCircle, Users, Pencil, Trash2, type LucideIcon,
} from 'lucide-react'
import { ActivityType } from '@crm/shared'
import type { ActivityWithRelations } from '../../../api/activities'
import './ActivityCard.css'

const ACTIVITY_ICON: Record<ActivityType, LucideIcon> = {
  [ActivityType.CALL]:          Phone,
  [ActivityType.EMAIL]:         Mail,
  [ActivityType.WHATSAPP_NOTE]: MessageCircle,
  [ActivityType.MEETING]:       Users,
  [ActivityType.STAGE_CHANGED]: Pencil,
  [ActivityType.DOC_UPLOADED]:  Pencil,
  [ActivityType.EXPORT]:        Pencil,
  [ActivityType.CREATED]:       Pencil,
  [ActivityType.UPDATED]:       Pencil,
}

const ACTIVITY_COLOR: Record<ActivityType, string> = {
  [ActivityType.CALL]:          'green',
  [ActivityType.EMAIL]:         'blue',
  [ActivityType.WHATSAPP_NOTE]: 'amber',
  [ActivityType.MEETING]:       'purple',
  [ActivityType.STAGE_CHANGED]: 'orange',
  [ActivityType.DOC_UPLOADED]:  'teal',
  [ActivityType.EXPORT]:        'muted',
  [ActivityType.CREATED]:       'muted',
  [ActivityType.UPDATED]:       'muted',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

interface ActivityCardProps {
  activity:  ActivityWithRelations
  canDelete: boolean
  onEdit:    (activity: ActivityWithRelations) => void
  onDelete:  (activity: ActivityWithRelations) => void
}

export default function ActivityCard({ activity, canDelete, onEdit, onDelete }: ActivityCardProps) {
  const { t } = useTranslation()
  const Icon  = ACTIVITY_ICON[activity.type] ?? Pencil
  const color = ACTIVITY_COLOR[activity.type] ?? 'muted'

  return (
    <li className="activity-card section-card">
      <span className={`activity-card__icon activity-card__icon--${color}`} aria-hidden>
        <Icon size={16} />
      </span>

      <div className="activity-card__body">
        <div className="activity-card__header">
          <div className="activity-card__meta">
            <span className="activity-card__type">
              {t(`activities.type.${activity.type}`)}
            </span>
            {activity.direction && (
              <span className="activity-card__direction">
                {t(`activities.direction.${activity.direction}`)}
              </span>
            )}
          </div>
          <div className="activity-card__when">
            <span className="activity-card__date">{formatDate(activity.activityAt)}</span>
            {activity.user && (
              <span className="activity-card__user">{activity.user.displayName}</span>
            )}
          </div>
        </div>

        <p className="activity-card__subject">{activity.subject}</p>

        {activity.description && (
          <p className="activity-card__detail">{activity.description}</p>
        )}
        {activity.outcome && (
          <p className="activity-card__detail activity-card__detail--muted">
            <strong>{t('activities.form.outcome')}:</strong> {activity.outcome}
          </p>
        )}
        {activity.nextStep && (
          <p className="activity-card__detail activity-card__detail--muted">
            <strong>{t('activities.form.nextStep')}:</strong> {activity.nextStep}
          </p>
        )}
      </div>

      <div className="activity-card__actions">
        <button
          className="icon-btn"
          title={t('activities.actions.edit')}
          onClick={() => onEdit(activity)}
        >
          <Pencil size={14} />
        </button>
        {canDelete && (
          <button
            className="icon-btn icon-btn--danger"
            title={t('activities.actions.delete')}
            onClick={() => onDelete(activity)}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </li>
  )
}
