import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { Plus, Pencil } from 'lucide-react'
import { normalizeSearch } from '../../../utils/search'
import { useCases } from '../../../context/DataContext'
import { deleteCase, type Case, type CaseStatus, type CasePriority } from '../../../api/cases'
import { usePermissions } from '../../../hooks/usePermissions'
import CaseForm from '../CaseForm/CaseForm'
import CaseDetail from '../CaseDetail/CaseDetail'
import BasicSearch from '../../shared/BasicSearch/BasicSearch'
import './Cases.css'

// ── Badge maps ────────────────────────────────────────────────────────────────

const STATUS_CLASS: Record<CaseStatus, string> = {
  NEW:         'badge-case-new',
  ON_HOLD:     'badge-case-on-hold',
  FORWARDED:   'badge-case-forwarded',
  IN_PROGRESS: 'badge-case-in-progress',
  CLOSED:      'badge-case-closed',
}

const PRIORITY_CLASS: Record<CasePriority, string> = {
  HIGH:   'badge-priority-high',
  NORMAL: 'badge-priority-normal',
  LOW:    'badge-priority-low',
}

// ── /cases (list) ─────────────────────────────────────────────────────────────

function CasesListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { cases, loading } = useCases()
  const [search, setSearch] = useState('')

  const q = normalizeSearch(search)
  const filtered = loading
    ? []
    : cases.filter((c) =>
        normalizeSearch(c.client.name).includes(q) ||
        normalizeSearch(c.name).includes(q) ||
        normalizeSearch(c.description ?? '').includes(q)
      )

  return (
    <div className="cases">
      <div className="page-header">
        <h1 className="page-title">{t('cases.title')}</h1>
        <button className="btn-primary" onClick={() => navigate('/cases/new')}>
          <Plus size={16} />
          {t('cases.new')}
        </button>
      </div>

      <BasicSearch
        value={search}
        onChange={setSearch}
        placeholder={t('cases.search')}
      />

      {loading ? null : filtered.length === 0 ? (
        <div className="cases__empty">
          <p>{search ? t('cases.emptySearch') : t('cases.empty')}</p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('cases.columns.client')}</th>
                <th>{t('cases.columns.name')}</th>
                <th>{t('cases.columns.status')}</th>
                <th>{t('cases.columns.priority')}</th>
                <th>{t('cases.columns.occurrenceAt')}</th>
                <th>{t('cases.columns.updatedAt')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="cases__row" onClick={() => navigate(`/cases/${c.id}`)}>
                  <td className="cases__client">{c.client.name}</td>
                  <td className="cases__name">{c.name}</td>
                  <td>
                    <span className={`badge ${STATUS_CLASS[c.status]}`}>
                      {t(`cases.status.${c.status}`)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${PRIORITY_CLASS[c.priority]}`}>
                      {t(`cases.priority.${c.priority}`)}
                    </span>
                  </td>
                  <td className="cases__date">
                    {c.occurrenceAt
                      ? new Date(c.occurrenceAt).toLocaleString('es-ES', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="cases__date">
                    {new Date(c.updatedAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="cases__actions">
                    <button
                      className="icon-btn"
                      onClick={(e) => { e.stopPropagation(); navigate(`/cases/${c.id}/edit`) }}
                      title={t('cases.edit')}
                    >
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── /cases/:caseId (detail) ───────────────────────────────────────────────────

function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>()
  const navigate   = useNavigate()
  const { cases }  = useCases()

  const caseItem = cases.find((c) => c.id === caseId)
  if (!caseItem) return null

  return (
    <CaseDetail
      case={caseItem}
      onBack={() => navigate(-1)}
      onEdit={() => navigate(`/cases/${caseId}/edit`)}
      onViewClient={(clientId) => navigate(`/clients/${clientId}`)}
      onViewSale={(saleId) => navigate(`/sales/${saleId}`)}
    />
  )
}

// ── /cases/new  and  /cases/:caseId/edit (form) ───────────────────────────────

function CaseFormPage() {
  const { caseId } = useParams<{ caseId?: string }>()
  const navigate   = useNavigate()
  const { cases, upsertCase, removeCase } = useCases()
  const { canDelete } = usePermissions()

  const existing: Case | null = caseId ? cases.find((c) => c.id === caseId) ?? null : null

  return (
    <CaseForm
      key={caseId ?? 'new'}
      case={existing}
      onSave={(saved) => { upsertCase(saved); navigate(`/cases/${saved.id}`) }}
      onCancel={() => navigate(-1)}
      onDelete={canDelete
        ? async (id) => { await deleteCase(id); removeCase(id); navigate('/cases') }
        : undefined}
    />
  )
}

// ── Module router ─────────────────────────────────────────────────────────────

export default function Cases() {
  return (
    <Routes>
      <Route index element={<CasesListPage />} />
      <Route path="new" element={<CaseFormPage />} />
      <Route path=":caseId" element={<CaseDetailPage />} />
      <Route path=":caseId/edit" element={<CaseFormPage />} />
    </Routes>
  )
}
