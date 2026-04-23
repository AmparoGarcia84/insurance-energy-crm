import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SaleDocumentsTab from './SaleDocumentsTab'
import { DocumentGroup, DocumentType, DocumentStatus } from '../../../api/documents'
import type { DocumentRecord } from '../../../api/documents'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'documents.table.count' && opts) return `${opts.count} documentos`
      return key
    },
  }),
}))

const mockGetDocuments   = vi.fn()
const mockDeleteDocument = vi.fn()
vi.mock('../../../api/documents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/documents')>()
  return {
    ...actual,
    getDocuments:   (clientId: string, saleId?: string) => mockGetDocuments(clientId, saleId),
    deleteDocument: (id: string) => mockDeleteDocument(id),
  }
})

vi.mock('../../../context/DataContext', () => ({
  useClients: () => ({ clients: [] }),
  useSales:   () => ({ sales:   [] }),
}))

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'OWNER' } }),
}))

let mockCanDelete = true
vi.mock('../../../hooks/usePermissions', () => ({
  usePermissions: () => ({ canDelete: mockCanDelete }),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeDoc = (overrides: Partial<DocumentRecord> = {}): DocumentRecord => ({
  id:               'd1',
  name:             'Contrato Energía 2025',
  group:            DocumentGroup.ENERGY,
  documentType:     DocumentType.CONTRACT,
  status:           DocumentStatus.UPDATED,
  includedAt:       '2025-01-10T00:00:00Z',
  expiryDate:       '2026-01-10',
  fileUrl:          '/uploads/documents/contrato.pdf',
  clientId:         'c-1',
  saleId:           's-1',
  uploadedByUserId: 'u-1',
  createdAt:        '2025-01-10T00:00:00Z',
  updatedAt:        '2025-01-10T00:00:00Z',
  ...overrides,
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SaleDocumentsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCanDelete = true
    mockDeleteDocument.mockResolvedValue(undefined)
  })

  it('shows document count and add button', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<SaleDocumentsTab saleId="s-1" clientId="c-1" clientName="Ana García" />)
    await waitFor(() => {
      expect(screen.getByText('1 documentos')).toBeInTheDocument()
    })
    expect(screen.getByText('documents.actions.add')).toBeInTheDocument()
  })

  it('fetches documents filtered by clientId and saleId', async () => {
    mockGetDocuments.mockResolvedValue([])
    render(<SaleDocumentsTab saleId="s-1" clientId="c-1" clientName="Ana García" />)
    await waitFor(() => {
      expect(mockGetDocuments).toHaveBeenCalledWith('c-1', 's-1')
    })
  })

  it('shows empty state when no documents', async () => {
    mockGetDocuments.mockResolvedValue([])
    render(<SaleDocumentsTab saleId="s-1" clientId="c-1" clientName="Ana García" />)
    await waitFor(() => {
      expect(screen.getByText('documents.table.empty')).toBeInTheDocument()
    })
  })

  it('renders table headers when documents exist', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<SaleDocumentsTab saleId="s-1" clientId="c-1" clientName="Ana García" />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('documents.table.name')).toBeInTheDocument()
    expect(screen.getByText('documents.table.type')).toBeInTheDocument()
    expect(screen.getByText('documents.table.status')).toBeInTheDocument()
    expect(screen.getByText('documents.table.expiryDate')).toBeInTheDocument()
  })

  it('renders document name in a row', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<SaleDocumentsTab saleId="s-1" clientId="c-1" clientName="Ana García" />)
    await waitFor(() => {
      expect(screen.getByText('Contrato Energía 2025')).toBeInTheDocument()
    })
  })

  it('shows delete button when canDelete is true', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<SaleDocumentsTab saleId="s-1" clientId="c-1" clientName="Ana García" />)
    await waitFor(() => screen.getByRole('table'))
    expect(screen.getByTitle('documents.actions.delete')).toBeInTheDocument()
  })

  it('hides delete button when canDelete is false', async () => {
    mockCanDelete = false
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<SaleDocumentsTab saleId="s-1" clientId="c-1" clientName="Ana García" />)
    await waitFor(() => screen.getByRole('table'))
    expect(screen.queryByTitle('documents.actions.delete')).not.toBeInTheDocument()
  })

  it('opens upload modal when add button is clicked', async () => {
    mockGetDocuments.mockResolvedValue([])
    render(<SaleDocumentsTab saleId="s-1" clientId="c-1" clientName="Ana García" />)
    await waitFor(() => screen.getByText('documents.actions.add'))
    await userEvent.click(screen.getByText('documents.actions.add'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('opens confirm modal when delete button is clicked', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<SaleDocumentsTab saleId="s-1" clientId="c-1" clientName="Ana García" />)
    await waitFor(() => screen.getByTitle('documents.actions.delete'))
    await userEvent.click(screen.getByTitle('documents.actions.delete'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('calls deleteDocument and removes row on confirm', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc({ id: 'd1', name: 'Contrato Energía 2025' })])
    render(<SaleDocumentsTab saleId="s-1" clientId="c-1" clientName="Ana García" />)
    await waitFor(() => screen.getByTitle('documents.actions.delete'))
    await userEvent.click(screen.getByTitle('documents.actions.delete'))

    const confirmBtns = screen.getAllByText('documents.actions.delete')
    await userEvent.click(confirmBtns[confirmBtns.length - 1])

    expect(mockDeleteDocument).toHaveBeenCalledWith('d1')
    await waitFor(() => {
      expect(screen.queryByText('Contrato Energía 2025')).not.toBeInTheDocument()
    })
  })

  it('filters documents by name', async () => {
    mockGetDocuments.mockResolvedValue([
      makeDoc({ id: 'd1', name: 'Contrato Energía 2025' }),
      makeDoc({ id: 'd2', name: 'Póliza Hogar' }),
    ])
    render(<SaleDocumentsTab saleId="s-1" clientId="c-1" clientName="Ana García" />)
    await waitFor(() => screen.getByPlaceholderText('documents.table.search'))
    await userEvent.type(screen.getByPlaceholderText('documents.table.search'), 'póliza')
    expect(screen.queryByText('Contrato Energía 2025')).not.toBeInTheDocument()
    expect(screen.getByText('Póliza Hogar')).toBeInTheDocument()
  })
})
