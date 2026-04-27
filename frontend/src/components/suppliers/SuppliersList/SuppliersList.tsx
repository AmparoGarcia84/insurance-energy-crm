import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { usePermissions } from '../../../hooks/usePermissions'
import { normalizeSearch } from '../../../utils/search'
import type { Supplier } from '../../../api/suppliers'
import './SuppliersList.css'

interface Props {
  suppliers: Supplier[]
  loading:   boolean
  onNew:     () => void
  onView:    (supplier: Supplier) => void
  onEdit:    (supplier: Supplier) => void
  onDelete:  (supplier: Supplier) => void
}

export default function SuppliersList({ suppliers, loading, onNew, onView, onEdit, onDelete }: Props) {
  const { t }         = useTranslation()
  const { canDelete } = usePermissions()
  const [search, setSearch] = useState('')

  const filtered = suppliers.filter((s) => {
    const q = normalizeSearch(search)
    return (
      normalizeSearch(s.name).includes(q) ||
      (s.cif   ? normalizeSearch(s.cif).includes(q)   : false) ||
      (s.phone  ? normalizeSearch(s.phone).includes(q) : false)
    )
  })

  const primaryEmail = (s: Supplier) =>
    s.emails?.find((e) => e.isPrimary)?.address ?? s.emails?.[0]?.address

  const fiscalStreet = (s: Supplier) =>
    (s.addresses?.find((a) => a.type === 'FISCAL') ?? s.addresses?.[0])?.street

  return (
    <div className="suppliers-list-view">
      <div className="page-header">
        <h1 className="page-title">{t('suppliers.title')}</h1>
        <button className="btn-primary" onClick={onNew}>
          <Plus size={16} />
          {t('suppliers.new')}
        </button>
      </div>

      <div className="table-search">
        <Search size={16} />
        <input
          id="suppliers-search"
          name="suppliers-search"
          type="search"
          autoComplete="off"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('suppliers.search')}
        />
      </div>

      {loading ? null : filtered.length === 0 ? (
        <p className="suppliers-empty">
          {search ? t('suppliers.emptySearch') : t('suppliers.empty')}
        </p>
      ) : (
        <div className="suppliers-table-wrap">
          <table className="suppliers-table">
            <thead>
              <tr>
                <th>{t('suppliers.fields.name')}</th>
                <th>{t('suppliers.fields.cif')}</th>
                <th>{t('suppliers.fields.phone')}</th>
                <th>{t('suppliers.fields.email')}</th>
                <th>{t('suppliers.fields.address')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} onClick={() => onView(s)} style={{ cursor: 'pointer' }}>
                  <td>
                    <span className="suppliers-name">{s.name}</span>
                  </td>
                  <td className="suppliers-cif">{s.cif ?? '—'}</td>
                  <td>{s.phone ?? '—'}</td>
                  <td>{primaryEmail(s) ?? '—'}</td>
                  <td className="suppliers-address">{fiscalStreet(s) ?? '—'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="suppliers-actions">
                      <button
                        className="icon-btn"
                        onClick={() => onEdit(s)}
                        title={t('suppliers.edit')}
                      >
                        <Pencil size={15} />
                      </button>
                      {canDelete && (
                        <button
                          className="icon-btn icon-btn-danger"
                          onClick={() => onDelete(s)}
                          title={t('suppliers.actions.delete')}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
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
