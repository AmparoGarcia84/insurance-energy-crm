import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil } from 'lucide-react'
import { normalizeSearch } from '../../../utils/search'
import BasicSearch from '../../shared/BasicSearch/BasicSearch'
import { useAuth } from '../../../auth/AuthContext'
import { useSales } from '../../../context/DataContext'
import SaleDetail from '../../sales/SaleDetail/SaleDetail'
import SaleForm from '../../sales/SaleForm/SaleForm'
import type { Sale } from '../../../api/sales'
import {
  SaleType,
  InsuranceSaleStage,
  INSURANCE_STAGE_COLORS,
} from '../../../api/sales'
import './Policies.css'

// ── Navigation stack ──────────────────────────────────────────────────────────

type View =
  | { kind: 'list' }
  | { kind: 'detail'; sale: Sale }
  | { kind: 'form';   sale: Sale }

// ── Helpers ───────────────────────────────────────────────────────────────────

function branchClass(branch: string): string {
  const b = branch.toLowerCase()
  if (b.includes('vida'))   return 'badge-branch-vida'
  if (b.includes('hogar'))  return 'badge-branch-hogar'
  if (b.includes('salud'))  return 'badge-branch-salud'
  if (b.includes('dental')) return 'badge-branch-dental'
  if (b.startsWith('rc'))   return 'badge-branch-rc'
  if (b.includes('auto'))   return 'badge-branch-auto'
  return 'badge-branch-default'
}

interface Props {
  onNavigateToClient?: (clientId: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Policies({ onNavigateToClient }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const ownerName = user?.displayName ?? ''
  const { sales, loading, upsertSale, removeSale } = useSales()

  const [stack, setStack] = useState<View[]>([{ kind: 'list' }])
  const push = (v: View) => setStack(s => [...s, v])
  const pop  = ()        => setStack(s => s.length > 1 ? s.slice(0, -1) : s)
  const goToList = ()    => setStack([{ kind: 'list' }])

  const [search, setSearch] = useState('')

  const current = stack[stack.length - 1]

  // ── Form view ───────────────────────────────────────────────────────────────
  if (current.kind === 'form') {
    return (
      <SaleForm
        sale={current.sale}
        onSave={(saved) => { upsertSale(saved); pop() }}
        onCancel={pop}
        onDelete={(id) => { removeSale(id); goToList() }}
      />
    )
  }

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (current.kind === 'detail') {
    return (
      <SaleDetail
        sale={current.sale}
        onBack={pop}
        onEdit={(s) => push({ kind: 'form', sale: s })}
        onViewClient={onNavigateToClient}
      />
    )
  }

  // ── List view ────────────────────────────────────────────────────────────────
  const insuranceSales = loading
    ? []
    : sales
        .filter(s => s.type === SaleType.INSURANCE)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const q = normalizeSearch(search)
  const filtered = insuranceSales.filter(s =>
    normalizeSearch(s.clientName ?? '').includes(q) ||
    normalizeSearch(s.title).includes(q) ||
    normalizeSearch(s.insuranceBranch ?? '').includes(q) ||
    normalizeSearch(s.companyName ?? '').includes(q) ||
    normalizeSearch(s.ownerUserName ?? '').includes(q) ||
    normalizeSearch(s.policyNumber ?? '').includes(q)
  )

  return (
    <div className="policies">
      <div className="page-header">
        <h1 className="page-title">{t('policies.title')}</h1>
      </div>

      <BasicSearch
        value={search}
        onChange={setSearch}
        placeholder={t('policies.search')}
      />

      {loading ? null : filtered.length === 0 ? (
        <div className="policies__empty">
          <p>{search ? t('policies.emptySearch') : t('policies.empty')}</p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('policies.columns.client')}</th>
                <th>{t('policies.columns.title')}</th>
                <th>{t('policies.columns.stage')}</th>
                <th>{t('policies.columns.revenue')}</th>
                <th>{t('policies.columns.policyNumber')}</th>
                <th>{t('policies.columns.owner')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(sale => {
                const stage = sale.insuranceStage as InsuranceSaleStage | undefined
                const stageColor = stage ? INSURANCE_STAGE_COLORS[stage] : undefined
                const displayOwner = sale.ownerUserName ?? ownerName

                return (
                  <tr
                    key={sale.id}
                    className="policies__row"
                    onClick={() => push({ kind: 'detail', sale })}
                  >
                    <td className="policies__client">{sale.clientName ?? '—'}</td>
                    <td>
                      <div className="policies__title-cell">
                        {sale.insuranceBranch && (
                          <span className={`badge ${branchClass(sale.insuranceBranch)}`}>
                            {sale.insuranceBranch}
                          </span>
                        )}
                        <span className="policies__title">{sale.title}</span>
                      </div>
                    </td>
                    <td>
                      {stage && (
                        <span
                          className="policies__stage"
                          style={{ '--stage-color': stageColor } as React.CSSProperties}
                        >
                          <span className="policies__stage-dot" aria-hidden />
                          {t(`sales.stages.insurance.${stage}`)}
                        </span>
                      )}
                    </td>
                    <td className="policies__revenue">
                      {sale.expectedRevenue != null
                        ? `${sale.expectedRevenue.toLocaleString('es-ES')} €`
                        : '—'}
                    </td>
                    <td className="policies__policy-number">
                      {sale.policyNumber ?? '—'}
                    </td>
                    <td className="policies__owner">{displayOwner || '—'}</td>
                    <td className="policies__actions">
                      <button
                        className="icon-btn"
                        onClick={e => { e.stopPropagation(); push({ kind: 'form', sale }) }}
                        title={t('sales.edit')}
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
