import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../auth/AuthContext'
import { useSales } from '../../../context/DataContext'
import SaleCard from '../../sales/SaleCard/SaleCard'
import TaskListCard from '../../shared/TaskListCard/TaskListCard'
import ActivityListCard from '../../shared/ActivityListCard/ActivityListCard'
import type { TaskItem } from '../../shared/TaskListCard/TaskListCard'
import type { ActivityItem } from '../../shared/ActivityListCard/ActivityListCard'
import type { Sale } from '../../../api/sales'
import { SaleType, InsuranceSaleStage, EnergySaleStage } from '../../../api/sales'
import { getTasks } from '../../../api/tasks'
import type { TaskWithRelations } from '../../../api/tasks'
import { TaskStatus } from '../../../api/tasks'
import type { ActivityWithRelations } from '../../../api/activities'
import { getActivities } from '../../../api/activities'
import './ClientSummaryTab.css'

// ── Open-stage helpers ────────────────────────────────────────────────────────

const INSURANCE_OPEN_STAGES = new Set<string>([
  InsuranceSaleStage.RESPONSE_PENDING,
  InsuranceSaleStage.DOCUMENTS_PENDING,
  InsuranceSaleStage.SIGNATURE_PENDING,
  InsuranceSaleStage.ISSUANCE_PENDING,
  InsuranceSaleStage.BILLING_THIS_MONTH,
  InsuranceSaleStage.BILLING_NEXT_MONTH,
  InsuranceSaleStage.RECURRENT_BILLING,
  InsuranceSaleStage.INVOICE_PENDING_PAYMENT,
  InsuranceSaleStage.WRONG_SETTLEMENT,
])

const ENERGY_OPEN_STAGES = new Set<string>([
  EnergySaleStage.RESPONSE_PENDING,
  EnergySaleStage.DOCUMENTS_PENDING,
  EnergySaleStage.SIGNATURE_PENDING,
  EnergySaleStage.ACTIVATION_PENDING,
  EnergySaleStage.BILLING_THIS_MONTH,
])

function isOpenSale(sale: Sale): boolean {
  if (sale.type === SaleType.INSURANCE) {
    return sale.insuranceStage != null && INSURANCE_OPEN_STAGES.has(sale.insuranceStage)
  }
  return sale.energyStage != null && ENERGY_OPEN_STAGES.has(sale.energyStage)
}

// ── Data adapters ─────────────────────────────────────────────────────────────

const PENDING_STATUSES = new Set<TaskStatus>([
  TaskStatus.NOT_STARTED,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DEFERRED,
  TaskStatus.WAITING_FOR_INPUT,
  TaskStatus.UNLOGGED,
])

function toTaskItem(task: TaskWithRelations): TaskItem {
  return {
    id:       task.id,
    subject:  task.subject,
    priority: task.priority ?? 'NORMAL',
    dueDate:  task.dueDate ?? null,
    meta:     task.assignedTo?.displayName ?? null,
  }
}

function toActivityItem(activity: ActivityWithRelations): ActivityItem {
  return {
    id:      activity.id,
    type:    activity.type,
    subject: activity.subject,
    date:    activity.activityAt,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  clientId: string
  onViewSale: (sale: Sale) => void
}

export default function ClientSummaryTab({ clientId, onViewSale }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const ownerName = user?.displayName ?? ''
  const { sales, loading } = useSales()
  const [tasks, setTasks]           = useState<TaskWithRelations[]>([])
  const [activities, setActivities] = useState<ActivityWithRelations[]>([])

  useEffect(() => {
    getTasks({ clientId }).then((all) => {
      setTasks(all.filter((task) => PENDING_STATUSES.has(task.status as TaskStatus)))
    }).catch(() => {/* non-critical */})
  }, [clientId])

  useEffect(() => {
    getActivities({ clientId }).then((all) => {
      setActivities(all.slice(0, 5))
    }).catch(() => {/* non-critical */})
  }, [clientId])

  const openSales = loading
    ? []
    : sales.filter((s) => s.clientId === clientId && isOpenSale(s))

  return (
    <div className="cd-summary">

      {/* Card 1: Open opportunities */}
      <div className="section-card cd-summary__card">
        <div className="cd-summary__card-header">
          <h3 className="cd-summary__card-title">
            {t('clients.summary.openOpportunities')}
          </h3>
          {openSales.length > 0 && (
            <span className="cd-summary__card-count">
              {t('sales.opportunitiesCount', { count: openSales.length })}
            </span>
          )}
        </div>
        <div className="cd-summary__card-body">
          {loading ? null : openSales.length === 0 ? (
            <p className="cd-summary__empty">{t('clients.summary.noSales')}</p>
          ) : (
            <div className="cd-summary__sales-list">
              {openSales.map((sale) => (
                <SaleCard
                  key={sale.id}
                  sale={sale}
                  ownerName={ownerName}
                  onClick={onViewSale}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Pending tasks */}
      <TaskListCard
        title={t('clients.summary.pendingTasks')}
        items={tasks.map(toTaskItem)}
        emptyLabel={t('clients.summary.noTasks')}
        count={tasks.length > 0 ? tasks.length : undefined}
      />

      {/* Card 3: Recent activity */}
      <ActivityListCard
        title={t('clients.summary.recentActivity')}
        items={activities.map(toActivityItem)}
        emptyLabel={t('clients.summary.noActivity')}
        dateFormat="relative"
      />

    </div>
  )
}
