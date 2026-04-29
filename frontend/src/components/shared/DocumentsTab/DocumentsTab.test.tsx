import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DocumentsTab from './DocumentsTab'
import { DocumentGroup, DocumentType, DocumentStatus } from '../../../api/documents'
import type { DocumentRecord } from '../../../api/documents'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'documents.table.count' && opts) return `${opts.count} docs`
      return key
    },
  }),
}))

const mockGetDocuments = vi.fn()
const mockDeleteDocument = vi.fn()

vi.mock('../../../api/documents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/documents')>()
  return {
    ...actual,
    getDocuments:   (...args: unknown[]) => mockGetDocuments(...args),
    deleteDocument: (id: string)         => mockDeleteDocument(id),
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
  name:             'Póliza Hogar 2025',
  group:            DocumentGroup.INSURANCE,
  documentType:     DocumentType.POLICY,
  status:           DocumentStatus.UPDATED,
  includedAt:       '2025-01-10T00:00:00Z',
  expiryDate:       '2026-01-10',
  fileUrl:          '/uploads/documents/poliza.pdf',
  clientId:         'c1',
  saleId:           's1',
  uploadedByUserId: 'u1',
  createdAt:        '2025-01-10T00:00:00Z',
  updatedAt:        '2025-01-10T00:00:00Z',
  sale: { id: 's1', title: 'Seguro hogar', type: 'INSURANCE' },
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  mockCanDelete = true
  mockDeleteDocument.mockResolvedValue(undefined)
})

// ── Client context ─────────────────────────────────────────────────────────────

describe('DocumentsTab — client context (no saleId)', () => {
  it('fetches documents with clientId only', async () => {
    mockGetDocuments.mockResolvedValue([])
    render(<DocumentsTab clientId="c1" clientName="Ana García" />)
    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalledWith('c1', undefined))
  })

  it('shows the document count', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<DocumentsTab clientId="c1" clientName="Ana García" />)
    await waitFor(() => expect(screen.getByText('1 docs')).toBeInTheDocument())
  })

  it('shows the Sale column header', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<DocumentsTab clientId="c1" clientName="Ana García" />)
    await waitFor(() => screen.getByRole('table'))
    expect(screen.getByText('documents.table.sale')).toBeInTheDocument()
  })

  it('renders the associated sale title', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<DocumentsTab clientId="c1" clientName="Ana García" />)
    await waitFor(() => expect(screen.getByText('Seguro hogar')).toBeInTheDocument())
  })

  it('renders "—" in sale column when sale is null', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc({ saleId: null, sale: null })])
    render(<DocumentsTab clientId="c1" clientName="Ana García" />)
    await waitFor(() => screen.getByRole('table'))
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('filters by sale title when searching', async () => {
    mockGetDocuments.mockResolvedValue([
      makeDoc({ id: 'd1', name: 'Doc 1', sale: { id: 's1', title: 'Seguro Auto', type: 'INSURANCE' } }),
      makeDoc({ id: 'd2', name: 'Doc 2', sale: { id: 's2', title: 'Luz Ana', type: 'ENERGY' } }),
    ])
    render(<DocumentsTab clientId="c1" clientName="Ana García" />)
    await waitFor(() => screen.getByPlaceholderText('documents.table.search'))
    await userEvent.type(screen.getByPlaceholderText('documents.table.search'), 'auto')
    expect(screen.getByText('Doc 1')).toBeInTheDocument()
    expect(screen.queryByText('Doc 2')).not.toBeInTheDocument()
  })
})

// ── Sale context ───────────────────────────────────────────────────────────────

describe('DocumentsTab — sale context (with saleId)', () => {
  it('fetches documents with clientId and saleId', async () => {
    mockGetDocuments.mockResolvedValue([])
    render(<DocumentsTab clientId="c1" clientName="Ana García" saleId="s1" />)
    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalledWith('c1', 's1'))
  })

  it('hides the Sale column header', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<DocumentsTab clientId="c1" clientName="Ana García" saleId="s1" />)
    await waitFor(() => screen.getByRole('table'))
    expect(screen.queryByText('documents.table.sale')).not.toBeInTheDocument()
  })
})

// ── Shared behaviour ───────────────────────────────────────────────────────────

describe('DocumentsTab — shared behaviour', () => {
  it('shows empty state when no documents', async () => {
    mockGetDocuments.mockResolvedValue([])
    render(<DocumentsTab clientId="c1" clientName="Ana" />)
    await waitFor(() => expect(screen.getByText('documents.table.empty')).toBeInTheDocument())
  })

  it('renders table headers when documents exist', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<DocumentsTab clientId="c1" clientName="Ana" />)
    await waitFor(() => screen.getByRole('table'))
    expect(screen.getByText('documents.table.name')).toBeInTheDocument()
    expect(screen.getByText('documents.table.type')).toBeInTheDocument()
    expect(screen.getByText('documents.table.status')).toBeInTheDocument()
    expect(screen.getByText('documents.table.expiryDate')).toBeInTheDocument()
    expect(screen.getByText('documents.table.file')).toBeInTheDocument()
  })

  it('renders document name in a row', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<DocumentsTab clientId="c1" clientName="Ana" />)
    await waitFor(() => expect(screen.getByText('Póliza Hogar 2025')).toBeInTheDocument())
  })

  it('renders a file link when fileUrl is present', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<DocumentsTab clientId="c1" clientName="Ana" />)
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /documents.actions.viewFile/i })).toBeInTheDocument()
    )
  })

  it('renders "—" for file when fileUrl is null', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc({ fileUrl: null })])
    render(<DocumentsTab clientId="c1" clientName="Ana" />)
    await waitFor(() => screen.getByRole('table'))
    expect(document.querySelectorAll('.docs-tab__no-file').length).toBeGreaterThan(0)
  })

  it('shows delete button when canDelete is true', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<DocumentsTab clientId="c1" clientName="Ana" />)
    await waitFor(() => screen.getByRole('table'))
    expect(screen.getByTitle('documents.actions.delete')).toBeInTheDocument()
  })

  it('hides delete button when canDelete is false', async () => {
    mockCanDelete = false
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<DocumentsTab clientId="c1" clientName="Ana" />)
    await waitFor(() => screen.getByRole('table'))
    expect(screen.queryByTitle('documents.actions.delete')).not.toBeInTheDocument()
  })

  it('opens confirm modal when delete button is clicked', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<DocumentsTab clientId="c1" clientName="Ana" />)
    await waitFor(() => screen.getByTitle('documents.actions.delete'))
    await userEvent.click(screen.getByTitle('documents.actions.delete'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('calls deleteDocument and removes row on confirm', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc({ id: 'd1', name: 'Póliza Hogar 2025' })])
    render(<DocumentsTab clientId="c1" clientName="Ana" />)
    await waitFor(() => screen.getByTitle('documents.actions.delete'))
    await userEvent.click(screen.getByTitle('documents.actions.delete'))
    const confirmBtns = screen.getAllByText('documents.actions.delete')
    await userEvent.click(confirmBtns[confirmBtns.length - 1])
    expect(mockDeleteDocument).toHaveBeenCalledWith('d1')
    await waitFor(() =>
      expect(screen.queryByText('Póliza Hogar 2025')).not.toBeInTheDocument()
    )
  })

  it('closes confirm modal on cancel without deleting', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<DocumentsTab clientId="c1" clientName="Ana" />)
    await waitFor(() => screen.getByTitle('documents.actions.delete'))
    await userEvent.click(screen.getByTitle('documents.actions.delete'))
    await userEvent.click(screen.getByText('common.cancel'))
    expect(mockDeleteDocument).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('filters by name', async () => {
    mockGetDocuments.mockResolvedValue([
      makeDoc({ id: 'd1', name: 'Póliza Hogar 2025' }),
      makeDoc({ id: 'd2', name: 'Contrato Energía' }),
    ])
    render(<DocumentsTab clientId="c1" clientName="Ana" />)
    await waitFor(() => screen.getByPlaceholderText('documents.table.search'))
    await userEvent.type(screen.getByPlaceholderText('documents.table.search'), 'energía')
    expect(screen.queryByText('Póliza Hogar 2025')).not.toBeInTheDocument()
    expect(screen.getByText('Contrato Energía')).toBeInTheDocument()
  })

  it('shows emptySearch message when search yields no results', async () => {
    mockGetDocuments.mockResolvedValue([makeDoc()])
    render(<DocumentsTab clientId="c1" clientName="Ana" />)
    await waitFor(() => screen.getByPlaceholderText('documents.table.search'))
    await userEvent.type(screen.getByPlaceholderText('documents.table.search'), 'zzznomatch')
    expect(screen.getByText('documents.table.emptySearch')).toBeInTheDocument()
  })

  it('opens the upload modal when add button is clicked', async () => {
    mockGetDocuments.mockResolvedValue([])
    render(<DocumentsTab clientId="c1" clientName="Ana" />)
    await waitFor(() => screen.getByText('documents.actions.add'))
    await userEvent.click(screen.getByText('documents.actions.add'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes the upload modal when onClose is called', async () => {
    mockGetDocuments.mockResolvedValue([])
    render(<DocumentsTab clientId="c1" clientName="Ana" />)
    await waitFor(() => screen.getByText('documents.actions.add'))
    await userEvent.click(screen.getByText('documents.actions.add'))
    await userEvent.click(screen.getByLabelText('common.close'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders multiple document rows', async () => {
    mockGetDocuments.mockResolvedValue([
      makeDoc({ id: 'd1', name: 'Doc A' }),
      makeDoc({ id: 'd2', name: 'Doc B', fileUrl: null }),
    ])
    render(<DocumentsTab clientId="c1" clientName="Ana" />)
    await waitFor(() => {
      expect(screen.getByText('Doc A')).toBeInTheDocument()
      expect(screen.getByText('Doc B')).toBeInTheDocument()
    })
    expect(screen.getAllByRole('row').length).toBe(3) // 1 header + 2 data rows
  })
})
