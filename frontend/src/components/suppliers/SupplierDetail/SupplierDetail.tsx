import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil, Phone, Mail, MapPin, Plus, Search } from 'lucide-react'
import { AddressTypeLabels } from '@crm/shared'
import type { Supplier } from '../../../api/suppliers'
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
import TaskTable from '../../shared/TaskTable/TaskTable'
import TaskForm, { type TaskFormContext } from '../../shared/TaskForm/TaskForm'
import ConfirmModal from '../../shared/ConfirmModal/ConfirmModal'
import '../../shared/TaskTable/TaskTable.css'
import './SupplierDetail.css'

interface Props {
  supplier: Supplier
  onBack:   () => void
  onEdit:   (supplier: Supplier) => void
}

type Tab = 'info' | 'tasks'

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export default function SupplierDetail({ supplier, onBack, onEdit }: Props) {
  const { t }         = useTranslation()
  const { canDelete } = usePermissions()
  const [tab, setTab] = useState<Tab>('info')

  // ── Tasks state ────────────────────────────────────────────────────────────
  const [tasks, setTasks]                 = useState<TaskWithRelations[]>([])
  const [users, setUsers]                 = useState<AuthUser[]>([])
  const [loadingTasks, setLoadingTasks]   = useState(false)
  const [taskSearch, setTaskSearch]       = useState('')
  const [editingTask, setEditingTask]     = useState<TaskWithRelations | null>(null)
  const [showTaskForm, setShowTaskForm]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<TaskWithRelations | null>(null)

  const taskContext: TaskFormContext = {
    lockedSupplierId:   supplier.id,
    lockedSupplierName: supplier.name,
  }

  const loadTasks = useCallback(() => {
    setLoadingTasks(true)
    getTasks({ supplierId: supplier.id })
      .then(setTasks)
      .catch(() => {/* non-critical */})
      .finally(() => setLoadingTasks(false))
  }, [supplier.id])

  useEffect(() => {
    if (tab === 'tasks') loadTasks()
  }, [tab, loadTasks])

  useEffect(() => {
    getUsers().then(setUsers).catch(() => {/* non-critical */})
  }, [])

  const filteredTasks = taskSearch.trim()
    ? tasks.filter((task) =>
        task.subject.toLowerCase().includes(taskSearch.toLowerCase()) ||
        task.description?.toLowerCase().includes(taskSearch.toLowerCase())
      )
    : tasks

  // ── Task CRUD ──────────────────────────────────────────────────────────────

  function handleTaskSubmit(data: TaskPayload): Promise<TaskWithRelations> {
    if (editingTask) return updateTask(editingTask.id, data)
    return createTask(data)
  }

  function handleTaskSaved(task: TaskWithRelations) {
    setTasks((prev) => {
      const exists = prev.find((t) => t.id === task.id)
      return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev]
    })
    setShowTaskForm(false)
    setEditingTask(null)
  }

  function handleTaskStatusChange(task: TaskWithRelations, newStatus: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)))
    updateTask(task.id, { status: newStatus }).catch(() => {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)))
    })
  }

  async function handleTaskDeleteConfirm() {
    if (!confirmDelete) return
    try {
      await deleteTask(confirmDelete.id)
      setTasks((prev) => prev.filter((t) => t.id !== confirmDelete.id))
    } finally {
      setConfirmDelete(null)
    }
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string }[] = [
    { id: 'info',  label: t('suppliers.detail.tabs.info') },
    { id: 'tasks', label: t('suppliers.detail.tabs.tasks') },
  ]

  const fiscalAddress = supplier.addresses?.find((a) => a.type === 'FISCAL')
    ?? supplier.addresses?.[0]

  const primaryEmail = supplier.emails?.find((e) => e.isPrimary)?.address
    ?? supplier.emails?.[0]?.address

  // ── Task form ──────────────────────────────────────────────────────────────

  if (showTaskForm) {
    return (
      <TaskForm
        initial={editingTask}
        users={users}
        context={taskContext}
        onSubmit={handleTaskSubmit}
        onSave={handleTaskSaved}
        onCancel={() => { setShowTaskForm(false); setEditingTask(null) }}
      />
    )
  }

  // ── Detail view ────────────────────────────────────────────────────────────

  return (
    <div className="sd-view">

      {/* ── Header card ── */}
      <div className="cd-header">
        <div className="cd-header-left">
          <button className="icon-btn cd-back" onClick={onBack} title={t('suppliers.detail.back')}>
            <ArrowLeft size={18} />
          </button>

          <div className="cd-avatar">
            {initials(supplier.name)}
          </div>

          <div className="cd-header-info">
            <div className="cd-header-name-row">
              <h1 className="cd-name">{supplier.name}</h1>
              {supplier.cif && (
                <span className="sd-cif-badge">{supplier.cif}</span>
              )}
            </div>
            <div className="cd-header-meta">
              {supplier.phone && (
                <span className="cd-meta-item">
                  <Phone size={13} />
                  {supplier.phone}
                </span>
              )}
              {primaryEmail && (
                <span className="cd-meta-item">
                  <Mail size={13} />
                  {primaryEmail}
                </span>
              )}
              {fiscalAddress?.city && (
                <span className="cd-meta-item">
                  <MapPin size={13} />
                  {[fiscalAddress.city, fiscalAddress.province].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="cd-header-actions">
          <button className="btn-primary" onClick={() => onEdit(supplier)}>
            <Pencil size={15} />
            {t('suppliers.detail.editBtn')}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="cd-tabs">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            className={`cd-tab${tab === tb.id ? ' cd-tab-active' : ''}`}
            onClick={() => setTab(tb.id)}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Info ── */}
      {tab === 'info' && (
        <div className="sd-info-card">
          <div className="cd-sections">

            {/* Datos generales */}
            <section className="cd-section">
              <div className="cd-grid">
                <div className="cd-field">
                  <span className="cd-field-label">{t('suppliers.fields.name')}</span>
                  <span className="cd-field-value">{supplier.name}</span>
                </div>
                {supplier.cif && (
                  <div className="cd-field">
                    <span className="cd-field-label">{t('suppliers.fields.cif')}</span>
                    <span className="cd-field-value sd-monospace">{supplier.cif}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="cd-field">
                    <span className="cd-field-label">{t('suppliers.fields.phone')}</span>
                    <span className="cd-field-value">{supplier.phone}</span>
                  </div>
                )}
                {supplier.secondaryPhone && (
                  <div className="cd-field">
                    <span className="cd-field-label">{t('suppliers.fields.secondaryPhone')}</span>
                    <span className="cd-field-value">{supplier.secondaryPhone}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Dirección fiscal */}
            {supplier.addresses && supplier.addresses.length > 0 && (
              <section className="cd-section">
                <h3 className="cd-section-title">{t('suppliers.fields.address')}</h3>
                <div className="cd-address-list">
                  {supplier.addresses.map((addr) => (
                    <div key={addr.id} className="cd-address-card">
                      <span className="cd-address-type">
                        {AddressTypeLabels[addr.type]}
                      </span>
                      {addr.street && <div>{addr.street}</div>}
                      {(addr.postalCode || addr.city) && (
                        <div>{[addr.postalCode, addr.city].filter(Boolean).join(' ')}</div>
                      )}
                      {addr.province && <div>{addr.province}</div>}
                      {addr.country && <div>{addr.country}</div>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Correos */}
            {supplier.emails && supplier.emails.length > 0 && (
              <section className="cd-section">
                <h3 className="cd-section-title">{t('suppliers.fields.email')}</h3>
                <div className="sd-email-list">
                  {supplier.emails.map((email) => (
                    <div key={email.id} className="sd-email-item">
                      <Mail size={14} />
                      <span>{email.address}</span>
                      {email.label && (
                        <span className="sd-email-label" style={email.labelColor ? { background: email.labelColor } : undefined}>
                          {email.label}
                        </span>
                      )}
                      {email.isPrimary && (
                        <span className="sd-email-primary">principal</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      )}

      {/* ── Tab: Tasks ── */}
      {tab === 'tasks' && (
        <div className="sd-tasks">
          <div className="ctt-toolbar">
            <span className="ctt-toolbar__count">
              {!loadingTasks && t('tasks.count', { count: tasks.length })}
            </span>
            <button className="btn-primary" onClick={() => { setEditingTask(null); setShowTaskForm(true) }}>
              <Plus size={15} />
              {t('tasks.newTask')}
            </button>
          </div>

          {!loadingTasks && tasks.length > 0 && (
            <div className="table-search">
              <Search size={15} />
              <input
                type="search"
                autoComplete="off"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder={t('tasks.searchPlaceholder')}
              />
            </div>
          )}

          {loadingTasks ? null : filteredTasks.length === 0 ? (
            <div className="ctt-empty">
              <p>{taskSearch.trim() ? t('tasks.emptySearch') : t('tasks.noTasks')}</p>
            </div>
          ) : (
            <TaskTable
              tasks={filteredTasks}
              canDelete={canDelete}
              onStatusChange={handleTaskStatusChange}
              onEdit={(task) => { setEditingTask(task); setShowTaskForm(true) }}
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
                { label: t('tasks.actions.delete'), onClick: handleTaskDeleteConfirm,      variant: 'primary'   },
              ]}
            />
          )}
        </div>
      )}
    </div>
  )
}
