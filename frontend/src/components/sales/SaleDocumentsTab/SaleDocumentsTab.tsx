import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, ExternalLink, Trash2, Search } from 'lucide-react'
import { normalizeSearch } from '../../../utils/search'
import {
  getDocuments,
  deleteDocument,
  DocumentGroup,
  DocumentType,
  DocumentStatus,
  type DocumentRecord,
} from '../../../api/documents'
import { usePermissions } from '../../../hooks/usePermissions'
import DocumentUploadModal from '../../shared/DocumentUploadModal/DocumentUploadModal'
import ConfirmModal from '../../shared/ConfirmModal/ConfirmModal'
import './SaleDocumentsTab.css'

interface Props {
  saleId:     string
  clientId:   string
  clientName: string
}

const STATUS_CLASS: Record<DocumentStatus, string> = {
  [DocumentStatus.PENDING_SIGNATURE]: 'doc-status--pending',
  [DocumentStatus.EXPIRED]:           'doc-status--expired',
  [DocumentStatus.UPDATED]:           'doc-status--updated',
  [DocumentStatus.UNDER_REVIEW]:      'doc-status--review',
}

export default function SaleDocumentsTab({ saleId, clientId, clientName }: Props) {
  const { t }         = useTranslation()
  const { canDelete } = usePermissions()

  const [docs,       setDocs]       = useState<DocumentRecord[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [toDelete,   setToDelete]   = useState<DocumentRecord | null>(null)
  const [deleting,   setDeleting]   = useState(false)

  useEffect(() => {
    setLoading(true)
    getDocuments(clientId, saleId)
      .then(setDocs)
      .finally(() => setLoading(false))
  }, [clientId, saleId])

  function handleSaved(doc: DocumentRecord) {
    setDocs((prev) => [doc, ...prev])
  }

  async function handleDeleteConfirm() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteDocument(toDelete.id)
      setDocs((prev) => prev.filter((d) => d.id !== toDelete.id))
    } finally {
      setDeleting(false)
      setToDelete(null)
    }
  }

  const backendBase = 'http://localhost:3000'

  const filtered = docs.filter((doc) => {
    const q = normalizeSearch(search)
    return normalizeSearch(doc.name).includes(q)
  })

  return (
    <div className="sdt-view">

      {/* ── Toolbar ── */}
      <div className="sdt-toolbar">
        <span className="sdt-toolbar__count">
          {t('documents.table.count', { count: docs.length })}
        </span>
        <button className="btn-primary" onClick={() => setShowUpload(true)}>
          <Plus size={15} />
          {t('documents.actions.add')}
        </button>
      </div>

      {/* ── Search ── */}
      {!loading && docs.length > 0 && (
        <div className="table-search">
          <Search size={15} />
          <input
            type="search"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('documents.table.search')}
          />
        </div>
      )}

      {/* ── Table / empty ── */}
      {loading ? null : filtered.length === 0 ? (
        <div className="sdt-empty">
          <p>{search ? t('documents.table.emptySearch') : t('documents.table.empty')}</p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table sdt-table">
            <thead>
              <tr>
                <th>{t('documents.table.name')}</th>
                <th>{t('documents.table.type')}</th>
                <th>{t('documents.table.group')}</th>
                <th>{t('documents.table.status')}</th>
                <th>{t('documents.table.expiryDate')}</th>
                <th>{t('documents.table.file')}</th>
                {canDelete && <th />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id}>
                  <td className="sdt-name">{doc.name}</td>
                  <td>{t(`documents.documentType.${doc.documentType as DocumentType}`)}</td>
                  <td>
                    {doc.group
                      ? t(`documents.group.${doc.group as DocumentGroup}`)
                      : '—'}
                  </td>
                  <td>
                    <span className={`cd-docs-tab__status ${STATUS_CLASS[doc.status as DocumentStatus]}`}>
                      {t(`documents.status.${doc.status as DocumentStatus}`)}
                    </span>
                  </td>
                  <td className="sdt-expiry">
                    {doc.expiryDate
                      ? new Date(doc.expiryDate).toLocaleDateString('es-ES')
                      : '—'}
                  </td>
                  <td>
                    {doc.fileUrl ? (
                      <a
                        href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `${backendBase}${doc.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cd-docs-tab__file-link"
                        title={t('documents.actions.viewFile')}
                      >
                        <ExternalLink size={14} />
                        <span>{t('documents.actions.viewFile')}</span>
                      </a>
                    ) : (
                      <span className="cd-docs-tab__no-file">—</span>
                    )}
                  </td>
                  {canDelete && (
                    <td className="cd-docs-tab__actions">
                      <button
                        className="icon-btn icon-btn-danger"
                        onClick={() => setToDelete(doc)}
                        title={t('documents.actions.delete')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Upload modal ── */}
      {showUpload && (
        <DocumentUploadModal
          defaultClientId={clientId}
          defaultSaleId={saleId}
          onClose={() => setShowUpload(false)}
          onSaved={handleSaved}
        />
      )}

      {/* ── Delete confirmation ── */}
      {toDelete && (
        <ConfirmModal
          title={t('documents.actions.delete')}
          message={t('documents.deleteConfirm', { name: toDelete.name })}
          onClose={() => setToDelete(null)}
          actions={[
            {
              label: t('common.cancel'),
              variant: 'secondary',
              onClick: () => setToDelete(null),
            },
            {
              label: deleting ? t('common.saving') : t('documents.actions.delete'),
              variant: 'primary',
              onClick: handleDeleteConfirm,
            },
          ]}
        />
      )}
    </div>
  )
}
