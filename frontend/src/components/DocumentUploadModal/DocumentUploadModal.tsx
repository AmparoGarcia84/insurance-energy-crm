import { useRef, useState } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import InputField from '../FormField/InputField'
import SelectField from '../FormField/SelectField'
import SearchableSelectField from '../FormField/SearchableSelectField'
import { useClients, useSales } from '../../context/DataContext'
import {
  DocumentGroup,
  DocumentType,
  DocumentStatus,
  createDocument,
  type DocumentRecord,
} from '../../api/documents'
import './DocumentUploadModal.css'

const DOCUMENT_GROUPS  = Object.values(DocumentGroup)
const DOCUMENT_TYPES   = Object.values(DocumentType)
const DOCUMENT_STATUSES = Object.values(DocumentStatus)

const MAX_FILE_BYTES = 20 * 1024 * 1024

interface Props {
  onClose: () => void
  onSaved: (doc: DocumentRecord) => void
  /** Pre-fill client when opening from a client context. */
  defaultClientId?: string
  /** Pre-fill sale when opening from a sale context. */
  defaultSaleId?: string
}

interface FormErrors {
  name?:         string
  documentType?: string
  status?:       string
  clientId?:     string
  file?:         string
}

export default function DocumentUploadModal({
  onClose,
  onSaved,
  defaultClientId = '',
  defaultSaleId   = '',
}: Props) {
  const { t } = useTranslation()
  const { clients } = useClients()
  const { sales }   = useSales()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name,         setName]         = useState('')
  const [group,        setGroup]        = useState<DocumentGroup | ''>('')
  const [documentType, setDocumentType] = useState<DocumentType | ''>('')
  const [status,       setStatus]       = useState<DocumentStatus>(DocumentStatus.PENDING_SIGNATURE)
  const [clientId,     setClientId]     = useState(defaultClientId)
  const [saleId,       setSaleId]       = useState(defaultSaleId)
  const [expiryDate,   setExpiryDate]   = useState('')
  const [file,         setFile]         = useState<File | null>(null)
  const [errors,       setErrors]       = useState<FormErrors>({})
  const [saving,       setSaving]       = useState(false)

  // ── Derived option lists ───────────────────────────────────────────────────

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }))

  const saleOptions = sales
    .filter((s) => s.clientId === clientId)
    .map((s)    => ({ value: s.id, label: s.title }))

  // ── File handling ──────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null
    if (!picked) return
    if (picked.type !== 'application/pdf') {
      setErrors((prev) => ({ ...prev, file: t('documents.errors.fileNotPdf') }))
      return
    }
    if (picked.size > MAX_FILE_BYTES) {
      setErrors((prev) => ({ ...prev, file: t('documents.errors.fileTooLarge') }))
      return
    }
    setErrors((prev) => ({ ...prev, file: undefined }))
    setFile(picked)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (!dropped) return
    if (dropped.type !== 'application/pdf') {
      setErrors((prev) => ({ ...prev, file: t('documents.errors.fileNotPdf') }))
      return
    }
    if (dropped.size > MAX_FILE_BYTES) {
      setErrors((prev) => ({ ...prev, file: t('documents.errors.fileTooLarge') }))
      return
    }
    setErrors((prev) => ({ ...prev, file: undefined }))
    setFile(dropped)
  }

  function removeFile() {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!name.trim())  errs.name         = t('documents.errors.nameRequired')
    if (!documentType) errs.documentType = t('documents.errors.typeRequired')
    if (!status)       errs.status       = t('documents.errors.statusRequired')
    if (!clientId)     errs.clientId     = t('documents.errors.clientRequired')
    return errs
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const fd = new FormData()
    fd.append('name',         name.trim())
    if (group) fd.append('group', group)
    fd.append('documentType', documentType as string)
    fd.append('status',       status)
    fd.append('clientId',     clientId)
    if (saleId)     fd.append('saleId',     saleId)
    if (expiryDate) fd.append('expiryDate', expiryDate)
    if (file)       fd.append('file',       file)

    setSaving(true)
    try {
      const saved = await createDocument(fd)
      onSaved(saved)
      onClose()
    } catch {
      setSaving(false)
    }
  }

  // ── Client change — reset sale ─────────────────────────────────────────────

  function handleClientChange(val: string) {
    setClientId(val)
    if (val !== clientId) setSaleId('')
    setErrors((prev) => ({ ...prev, clientId: undefined }))
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal document-upload-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('documents.uploadTitle')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="document-upload-modal__header">
          <h2 className="modal-title">{t('documents.uploadTitle')}</h2>
          <button
            type="button"
            className="document-upload-modal__close"
            aria-label={t('common.close')}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="document-upload-modal__body">

            {/* Name */}
            <InputField
              id="doc-name"
              label={t('documents.fields.name')}
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })) }}
              placeholder={t('documents.placeholders.name')}
              error={errors.name}
              required
            />

            {/* Group + Type */}
            <div className="document-upload-modal__row">
              <SelectField
                id="doc-group"
                label={t('documents.fields.group')}
                value={group}
                onChange={(e) => setGroup(e.target.value as DocumentGroup)}
              >
                <option value="">{t('documents.placeholders.selectGroup')}</option>
                {DOCUMENT_GROUPS.map((g) => (
                  <option key={g} value={g}>{t(`documents.group.${g}`)}</option>
                ))}
              </SelectField>

              <div className="form-field">
                <SelectField
                  id="doc-type"
                  label={t('documents.fields.documentType')}
                  value={documentType}
                  onChange={(e) => { setDocumentType(e.target.value as DocumentType); setErrors((p) => ({ ...p, documentType: undefined })) }}
                  className={errors.documentType ? 'form-field--error' : undefined}
                >
                  <option value="">{t('documents.placeholders.selectType')}</option>
                  {DOCUMENT_TYPES.map((dt) => (
                    <option key={dt} value={dt}>{t(`documents.documentType.${dt}`)}</option>
                  ))}
                </SelectField>
                {errors.documentType && <span className="form-field__error">{errors.documentType}</span>}
              </div>
            </div>

            {/* Status + Expiry date */}
            <div className="document-upload-modal__row">
              <SelectField
                id="doc-status"
                label={t('documents.fields.status')}
                value={status}
                onChange={(e) => setStatus(e.target.value as DocumentStatus)}
              >
                {DOCUMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`documents.status.${s}`)}</option>
                ))}
              </SelectField>

              <InputField
                id="doc-expiry"
                label={t('documents.fields.expiryDate')}
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            {/* Client */}
            <SearchableSelectField
              id="doc-client"
              label={t('documents.fields.client')}
              name="clientId"
              value={clientId}
              options={clientOptions}
              emptyLabel={t('documents.placeholders.noClient')}
              searchPlaceholder={t('common.searchOptions')}
              noResultsLabel={t('common.noResults')}
              onChange={handleClientChange}
              className={errors.clientId ? 'form-field--error' : undefined}
            />
            {errors.clientId && (
              <span className="form-field__error">{errors.clientId}</span>
            )}

            {/* Sale — only shown when a client is selected */}
            {clientId && (
              <SearchableSelectField
                id="doc-sale"
                label={t('documents.fields.sale')}
                name="saleId"
                value={saleId}
                options={saleOptions}
                emptyLabel={t('documents.placeholders.noSale')}
                searchPlaceholder={t('common.searchOptions')}
                noResultsLabel={t('common.noResults')}
                onChange={setSaleId}
              />
            )}

            {/* File upload */}
            <div className="form-field">
              <span className="form-field-label">{t('documents.fields.file')}</span>
              {file ? (
                <div className="document-upload-modal__file-selected">
                  <FileText size={16} />
                  <span className="document-upload-modal__file-name">{file.name}</span>
                  <button
                    type="button"
                    className="document-upload-modal__file-remove"
                    aria-label={t('common.close')}
                    onClick={removeFile}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  className="document-upload-modal__drop-zone"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                >
                  <Upload size={22} className="document-upload-modal__drop-icon" />
                  <span>{t('documents.fileDrop')}</span>
                  <span className="document-upload-modal__file-hint">{t('documents.fileHint')}</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="document-upload-modal__file-input"
                onChange={handleFileChange}
                aria-label={t('documents.fields.file')}
              />
              {errors.file && <span className="form-field__error">{errors.file}</span>}
            </div>

          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? t('documents.actions.saving') : t('documents.actions.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
