import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TrendingUp, TrendingDown, Minus,
  Euro, CheckCircle2, BarChart2, Users,
  Shield, Zap, AlertCircle,
} from 'lucide-react'
import { useAuth } from '../../../auth/AuthContext'
import { getDashboardSummary } from '../../../api/dashboard'
import type { DashboardSummary } from '../../../api/dashboard'
import TaskListCard from '../../shared/TaskListCard/TaskListCard'
import ActivityListCard from '../../shared/ActivityListCard/ActivityListCard'
import type { TaskItem } from '../../shared/TaskListCard/TaskListCard'
import type { ActivityItem } from '../../shared/ActivityListCard/ActivityListCard'
import './Home.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatEur(value: number): string {
  return value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
}

// ── KpiCard sub-component ─────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ElementType
  iconClass: string
  label: string
  value: string
  delta: number | null
  deltaLabel: string
  noComparisonLabel: string
}

function KpiCard({ icon: Icon, iconClass, label, value, delta, deltaLabel, noComparisonLabel }: KpiCardProps) {
  const hasData = delta !== null
  const positive = hasData && delta >= 0

  return (
    <div className="home-kpi-card section-card">
      <div className={`home-kpi-card__icon-wrap ${iconClass}`}>
        <Icon size={20} />
      </div>
      <div className="home-kpi-card__body">
        <span className="home-kpi-card__value">{value}</span>
        <span className="home-kpi-card__label">{label}</span>
        <span className={`home-kpi-card__delta ${hasData ? (positive ? 'delta--up' : 'delta--down') : 'delta--neutral'}`}>
          {hasData ? (
            <>
              {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {positive ? '+' : ''}{delta}% {deltaLabel}
            </>
          ) : (
            <>
              <Minus size={12} />
              {noComparisonLabel}
            </>
          )}
        </span>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Home() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const firstName = user?.displayName?.split(' ')[0] ?? ''

  if (loading) {
    return (
      <div className="home-shell">
        <div className="home-loading">
          <div className="home-loading__spinner" />
        </div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="home-shell">
        <div className="home-error">
          <AlertCircle size={20} />
          <span>{t('home.loadingError')}</span>
        </div>
      </div>
    )
  }

  const { thisMonth, delta, pipeline, recentActivities, pendingTasks } = summary

  const pipelineTotal = pipeline.insuranceOpenCount + pipeline.energyOpenCount
  const insurancePct = pipelineTotal > 0
    ? Math.round((pipeline.insuranceOpenCount / pipelineTotal) * 100)
    : 0
  const energyPct = 100 - insurancePct

  const taskItems: TaskItem[] = pendingTasks.map(t => ({
    id:       t.id,
    subject:  t.subject,
    priority: t.priority,
    dueDate:  t.dueDate,
    meta:     t.clientName ?? null,
  }))

  const activityItems: ActivityItem[] = recentActivities.map(a => ({
    id:      a.id,
    type:    a.type,
    subject: a.subject,
    date:    a.activityAt,
    context: a.clientName ?? a.saleTitle ?? null,
  }))

  return (
    <div className="home-shell">
      {/* ── Header ── */}
      <div className="page-header">
        <h1 className="page-title">{t('home.greeting')}{firstName ? `, ${firstName}` : ''}</h1>
      </div>

      {/* ── KPI row ── */}
      <div className="home-kpi-row">
        <KpiCard
          icon={Euro}
          iconClass="home-kpi-card__icon-wrap--gold"
          label={t('home.kpi.toCollect')}
          value={formatEur(thisMonth.toCollectAmount)}
          delta={delta.toCollectAmount}
          deltaLabel={t('home.kpi.vsLastMonth')}
          noComparisonLabel={t('home.kpi.noComparison')}
        />
        <KpiCard
          icon={CheckCircle2}
          iconClass="home-kpi-card__icon-wrap--green"
          label={t('home.kpi.collected')}
          value={formatEur(thisMonth.collectedAmount)}
          delta={delta.collectedAmount}
          deltaLabel={t('home.kpi.vsLastMonth')}
          noComparisonLabel={t('home.kpi.noComparison')}
        />
        <KpiCard
          icon={BarChart2}
          iconClass="home-kpi-card__icon-wrap--blue"
          label={t('home.kpi.newSales')}
          value={String(thisMonth.newSalesCount)}
          delta={delta.newSalesCount}
          deltaLabel={t('home.kpi.vsLastMonth')}
          noComparisonLabel={t('home.kpi.noComparison')}
        />
        <KpiCard
          icon={Users}
          iconClass="home-kpi-card__icon-wrap--purple"
          label={t('home.kpi.newClients')}
          value={String(thisMonth.newClientsCount)}
          delta={delta.newClientsCount}
          deltaLabel={t('home.kpi.vsLastMonth')}
          noComparisonLabel={t('home.kpi.noComparison')}
        />
      </div>

      {/* ── Middle row: pipeline + tasks ── */}
      <div className="home-middle-row">

        {/* Pipeline card */}
        <div className="section-card home-pipeline-card">
          <div className="home-card-header">
            <TrendingUp size={16} className="home-card-header__icon" />
            <h2 className="home-card-header__title">{t('home.pipeline.title')}</h2>
            {pipeline.openCount > 0 && (
              <span className="home-card-header__badge">
                {t('home.pipeline.openSales', { count: pipeline.openCount })}
              </span>
            )}
          </div>

          {pipeline.openCount === 0 ? (
            <p className="home-empty">{t('home.pipeline.empty')}</p>
          ) : (
            <div className="home-pipeline-body">
              <div className="home-pipeline-bar">
                {insurancePct > 0 && (
                  <div
                    className="home-pipeline-bar__segment home-pipeline-bar__segment--insurance"
                    style={{ width: `${insurancePct}%` }}
                    title={`${t('home.pipeline.insurance')}: ${pipeline.insuranceOpenCount}`}
                  />
                )}
                {energyPct > 0 && (
                  <div
                    className="home-pipeline-bar__segment home-pipeline-bar__segment--energy"
                    style={{ width: `${energyPct}%` }}
                    title={`${t('home.pipeline.energy')}: ${pipeline.energyOpenCount}`}
                  />
                )}
              </div>

              <div className="home-pipeline-legend">
                {pipeline.insuranceOpenCount > 0 && (
                  <div className="home-pipeline-legend__item">
                    <Shield size={13} className="home-pipeline-legend__icon--insurance" />
                    <span className="home-pipeline-legend__label">{t('home.pipeline.insurance')}</span>
                    <span className="home-pipeline-legend__count">{pipeline.insuranceOpenCount}</span>
                  </div>
                )}
                {pipeline.energyOpenCount > 0 && (
                  <div className="home-pipeline-legend__item">
                    <Zap size={13} className="home-pipeline-legend__icon--energy" />
                    <span className="home-pipeline-legend__label">{t('home.pipeline.energy')}</span>
                    <span className="home-pipeline-legend__count">{pipeline.energyOpenCount}</span>
                  </div>
                )}
              </div>

              {pipeline.openValue > 0 && (
                <div className="home-pipeline-value">
                  <span className="home-pipeline-value__label">{t('home.pipeline.openValue')}</span>
                  <span className="home-pipeline-value__amount">{formatEur(pipeline.openValue)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pending tasks */}
        <TaskListCard
          title={t('home.pendingTasks.title')}
          items={taskItems}
          emptyLabel={t('home.pendingTasks.empty')}
          noDueDateLabel={t('home.pendingTasks.noDueDate')}
        />
      </div>

      {/* ── Recent activity ── */}
      <ActivityListCard
        title={t('home.recentActivity.title')}
        items={activityItems}
        emptyLabel={t('home.recentActivity.empty')}
        dateFormat="absolute"
      />
    </div>
  )
}
