import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DocumentUploadModal from './DocumentUploadModal'
import type { Client } from '../../api/clients'
import type { Sale } from '../../api/sales'
import { DocumentGroup, DocumentType, DocumentStatus } from '../../api/documents'
import type { DocumentRecord } from '../../api/documents'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockClients: Client[] = [
  { id: 'c1', name: 'Ana García',   clientNumber: '001', addresses: [], bankAccounts: [] },
  { id: 'c2', name: 'Pedro López', clientNumber: '002', addresses: [], bankAccounts: [] },
]

const mockSales: Sale[] = [
  {
    id: 's1', clientId: 'c1', clientName: 'Ana García', title: 'Seguro hogar',
    type: 'INSURANCE' as any, createdAt: '', updatedAt: '',
  } as Sale,
  {
    id: 's2', clientId: 'c2', clientName: 'Pedro López', title: 'Contrato luz',
    type: 'ENERGY' as any, createdAt: '', updatedAt: '',
  } as Sale,
]

vi.mock('../../context/DataContext', () => ({
  useClients: () => ({ clients: mockClients }),
  useSales:   () => ({ sales:   mockSales   }),
}))

const mockCreateDocument = vi.fn()
vi.mock('../../api/documents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/documents')>()
  return {
    ...actual,
    createDocument: (fd: FormData) => mockCreateDocument(fd),
  }
})

const defaultSavedDoc: DocumentRecord = {
  id:               'd1',
  name:             'Póliza hogar',
  group:            DocumentGroup.INSURANCE,
  documentType:     DocumentType.POLICY,
  status:           DocumentStatus.UPDATED,
  includedAt:       new Date().toISOString(),
  expiryDate:       null,
  fileUrl:          null,
  clientId:         'c1',
  saleId:           null,
  uploadedByUserId: null,
  createdAt:        new Date().toISOString(),
  updatedAt:        new Date().toISOString(),
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderModal(overrides?: Partial<Parameters<typeof DocumentUploadModal>[0]>) {
  const onClose = vi.fn()
  const onSaved = vi.fn()
  render(
    <DocumentUploadModal
      onClose={onClose}
      onSaved={onSaved}
      {...overrides}
    />
  )
  return { onClose, onSaved }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DocumentUploadModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateDocument.mockResolvedValue(defaultSavedDoc)
  })

  it('renders as a dialog with upload title', () => {
    renderModal()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('documents.uploadTitle')).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', async () => {
    const { onClose } = renderModal()
    await userEvent.click(document.querySelector('.modal-backdrop')!)
    expect(onClose).toHaveBeenCalled()
  })

  it('does not call onClose when the modal itself is clicked', async () => {
    const { onClose } = renderModal()
    await userEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when the X button is clicked', async () => {
    const { onClose } = renderModal()
    await userEvent.click(screen.getByLabelText('common.close'))
    expect(onClose).toHaveBeenCalled()
  })

  it('renders all required form fields', () => {
    renderModal()
    expect(screen.getByLabelText('documents.fields.name')).toBeInTheDocument()
    expect(screen.getByLabelText('documents.fields.group')).toBeInTheDocument()
    expect(screen.getByLabelText('documents.fields.documentType')).toBeInTheDocument()
    expect(screen.getByLabelText('documents.fields.status')).toBeInTheDocument()
    expect(screen.getByLabelText('documents.fields.expiryDate')).toBeInTheDocument()
  })

  it('shows validation errors when submitting an empty form', async () => {
    renderModal()
    await userEvent.click(screen.getByText('documents.actions.save'))
    expect(screen.getByText('documents.errors.nameRequired')).toBeInTheDocument()
    // group is now optional — no error expected for it
    expect(screen.queryByText('documents.errors.groupRequired')).not.toBeInTheDocument()
    expect(screen.getByText('documents.errors.typeRequired')).toBeInTheDocument()
    expect(screen.getByText('documents.errors.clientRequired')).toBeInTheDocument()
  })

  it('does not call createDocument when form is invalid', async () => {
    renderModal()
    await userEvent.click(screen.getByText('documents.actions.save'))
    expect(mockCreateDocument).not.toHaveBeenCalled()
  })

  it('renders group options', () => {
    renderModal()
    const select = screen.getByLabelText('documents.fields.group') as HTMLSelectElement
    const values = Array.from(select.options).map((o) => o.value)
    expect(values).toContain(DocumentGroup.INSURANCE)
    expect(values).toContain(DocumentGroup.ENERGY)
  })

  it('renders document type options', () => {
    renderModal()
    const select = screen.getByLabelText('documents.fields.documentType') as HTMLSelectElement
    const values = Array.from(select.options).map((o) => o.value)
    expect(values).toContain(DocumentType.POLICY)
    expect(values).toContain(DocumentType.CONTRACT)
    expect(values).toContain(DocumentType.INVOICE)
  })

  it('renders status options with default PENDING_SIGNATURE selected', () => {
    renderModal()
    const select = screen.getByLabelText('documents.fields.status') as HTMLSelectElement
    expect(select.value).toBe(DocumentStatus.PENDING_SIGNATURE)
  })

  it('pre-fills clientId from defaultClientId prop — shows sale selector', () => {
    renderModal({ defaultClientId: 'c1' })
    // The sale label appears when a client is pre-filled
    expect(screen.getByText('documents.fields.sale')).toBeInTheDocument()
  })

  it('shows sale selector only when a client is selected', () => {
    renderModal()
    expect(screen.queryByText('documents.fields.sale')).not.toBeInTheDocument()
  })

  it('shows drop zone for file upload', () => {
    renderModal()
    expect(screen.getByText('documents.fileDrop')).toBeInTheDocument()
    expect(screen.getByText('documents.fileHint')).toBeInTheDocument()
  })

  it('rejects non-PDF files and shows error', async () => {
    renderModal()
    const input = document.querySelector('.document-upload-modal__file-input') as HTMLInputElement
    const notPdf = new File(['content'], 'image.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [notPdf] } })
    expect(screen.getByText('documents.errors.fileNotPdf')).toBeInTheDocument()
  })

  it('accepts a valid PDF file and shows its name', async () => {
    renderModal()
    const input = document.querySelector('.document-upload-modal__file-input') as HTMLInputElement
    const pdf = new File(['%PDF'], 'contract.pdf', { type: 'application/pdf' })
    fireEvent.change(input, { target: { files: [pdf] } })
    expect(screen.getByText('contract.pdf')).toBeInTheDocument()
  })

  it('removes selected file when X chip button is clicked', async () => {
    renderModal()
    const input = document.querySelector('.document-upload-modal__file-input') as HTMLInputElement
    const pdf = new File(['%PDF'], 'contract.pdf', { type: 'application/pdf' })
    fireEvent.change(input, { target: { files: [pdf] } })
    expect(screen.getByText('contract.pdf')).toBeInTheDocument()

    const removeBtn = document.querySelector('.document-upload-modal__file-remove') as HTMLButtonElement
    await userEvent.click(removeBtn)
    expect(screen.queryByText('contract.pdf')).not.toBeInTheDocument()
    expect(screen.getByText('documents.fileDrop')).toBeInTheDocument()
  })

  it('submits FormData and calls onSaved + onClose on success', async () => {
    renderModal({ defaultClientId: 'c1' })

    await userEvent.type(screen.getByLabelText('documents.fields.name'), 'Mi póliza')
    await userEvent.selectOptions(screen.getByLabelText('documents.fields.group'), DocumentGroup.INSURANCE)
    await userEvent.selectOptions(screen.getByLabelText('documents.fields.documentType'), DocumentType.POLICY)

    await userEvent.click(screen.getByText('documents.actions.save'))

    expect(mockCreateDocument).toHaveBeenCalledOnce()
    const fd: FormData = mockCreateDocument.mock.calls[0][0]
    expect(fd.get('name')).toBe('Mi póliza')
    expect(fd.get('group')).toBe(DocumentGroup.INSURANCE)
    expect(fd.get('clientId')).toBe('c1')
  })
})
