import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Pencil } from 'lucide-react'
import { normalizeSearch } from '../../../utils/search'
import { useAuth } from '../../../auth/AuthContext'
import { useSales } from '../../../context/DataContext'
import SaleDetail from '../../sales/SaleDetail/SaleDetail'
import SaleForm from '../../sales/SaleForm/SaleForm'
import type { Sale } from '../../../api/sales'
import {
  SaleType,
  EnergySaleStage,
  ENERGY_STAGE_COLORS,
} from '../../../api/sales'
import './Energy.css'

// ── Navigation stack ──────────────────────────────────────────────────────────

type View =
  | { kind: 'list' }
  | { kind: 'detail'; sale: Sale }
  | { kind: 'form';   sale: Sale }

interface Props {
  onNavigateToClient?: (clientId: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Energy({ onNavigateToClient }: Props) {
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
  const energySales = loading
    ? []
    : sales
        .filter(s => s.type === SaleType.ENERGY)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const q = normalizeSearch(search)
  const filtered = energySales.filter(s =>
    normalizeSearch(s.clientName ?? '').includes(q) ||
    normalizeSearch(s.title).includes(q) ||
    normalizeSearch(s.companyName ?? '').includes(q) ||
    normalizeSearch(s.ownerUserName ?? '').includes(q) ||
    normalizeSearch(s.contractId ?? '').includes(q)
  )

  return (
    <div className="energy">
      <div className="page-header">
        <h1 className="page-title">{t('energy.title')}</h1>
      </div>

      <div className="table-search">
        <Search size={15} />
        <input
          type="search"
          autoComplete="off"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('energy.search')}
        />
      </div>

      {loading ? null : filtered.length === 0 ? (
        <div className="energy__empty">
          <p>{search ? t('energy.emptySearch') : t('energy.empty')}</p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('energy.columns.client')}</th>
                <th>{t('energy.columns.title')}</th>
                <th>{t('energy.columns.stage')}</th>
                <th>{t('energy.columns.revenue')}</th>
                <th>{t('energy.columns.contractId')}</th>
                <th>{t('energy.columns.owner')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(sale => {
                const stage = sale.energyStage as EnergySaleStage | undefined
                const stageColor = stage ? ENERGY_STAGE_COLORS[stage] : undefined
                const displayOwner = sale.ownerUserName ?? ownerName

                return (
                  <tr
                    key={sale.id}
                    className="energy__row"
                    onClick={() => push({ kind: 'detail', sale })}
                  >
                    <td className="energy__client">{sale.clientName ?? '—'}</td>
                    <td>
                      <span className="energy__title">{sale.title}</span>
                    </td>
                    <td>
                      {stage && (
                        <span
                          className="energy__stage"
                          style={{ '--stage-color': stageColor } as React.CSSProperties}
                        >
                          <span className="energy__stage-dot" aria-hidden />
                          {t(`sales.stages.energy.${stage}`)}
                        </span>
                      )}
                    </td>
                    <td className="energy__revenue">
                      {sale.expectedRevenue != null
                        ? `${sale.expectedRevenue.toLocaleString('es-ES')} €`
                        : '—'}
                    </td>
                    <td className="energy__contract-id">
                      {sale.contractId ?? '—'}
                    </td>
                    <td className="energy__owner">{displayOwner || '—'}</td>
                    <td className="energy__actions">
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
