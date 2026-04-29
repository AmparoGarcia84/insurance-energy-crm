import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CasesTab from './CasesTab'
import type { Case } from '../../../api/cases'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'cases.casesTab.new':         'New case',
        'cases.casesTab.noCases':     'No cases yet',
        'cases.casesTab.emptySearch': 'No results for your search',
        'cases.search':               'Search cases...',
        'cases.columns.name':         'Case name',
        'cases.columns.status':       'Status',
        'cases.columns.priority':     'Priority',
        'cases.columns.occurrenceAt': 'Occurrence date',
        'cases.columns.updatedAt':    'Last updated',
        'cases.status.IN_PROGRESS':   'In progress',
        'cases.priority.HIGH':        'High',
        'cases.priority.NORMAL':      'Normal',
        'cases.edit':                 'Edit',
      }
      return map[key] ?? key
    },
  }),
}))

vi.mock('../../../hooks/usePermissions', () => ({
  usePermissions: () => ({ canDelete: true }),
}))

const mockUpsertCase = vi.fn()
const mockRemoveCase = vi.fn()
let mockCases: Case[] = []
let mockLoading = false

vi.mock('../../../context/DataContext', () => ({
  useCases: () => ({
    cases:      mockCases,
    loading:    mockLoading,
    upsertCase: mockUpsertCase,
    removeCase: mockRemoveCase,
  }),
}))

vi.mock('../../../api/cases', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/cases')>()
  return { ...actual, deleteCase: vi.fn().mockResolvedValue(undefined) }
})

vi.mock('../../cases/CaseForm/CaseForm', () => ({
  default: ({ case: c, initialClientId, initialSaleId }: {
    case: Case | null
    initialClientId?: string
    initialSaleId?: string
  }) => (
    <div
      data-testid="case-form"
      data-case-id={c?.id ?? 'new'}
      data-client-id={initialClientId}
      data-sale-id={initialSaleId}
    />
  ),
}))

vi.mock('../BasicSearch/BasicSearch', () => ({
  default: ({ value, onChange, placeholder }: {
    value: string
    onChange: (v: string) => void
    placeholder: string
  }) => (
    <input
      data-testid="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeCase = (id: string, overrides?: Partial<Case>): Case => ({
  id,
  clientId:  'c-1',
  client:    { id: 'c-1', name: 'Ana López' },
  saleId:    null,
  sale:      null,
  name:      `Case ${id}`,
  status:    'IN_PROGRESS',
  priority:  'HIGH',
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-04-01T10:00:00Z',
  ...overrides,
})

const noop = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockCases   = []
  mockLoading = false
})

// ── Empty state ────────────────────────────────────────────────────────────────

describe('CasesTab — empty state', () => {
  it('shows "No cases yet" when there are no cases', () => {
    render(<CasesTab clientId="c-1" clientName="Ana López" onViewCase={noop} />)
    expect(screen.getByText('No cases yet')).toBeInTheDocument()
  })

  it('always shows the "New case" button', () => {
    render(<CasesTab clientId="c-1" clientName="Ana López" onViewCase={noop} />)
    expect(screen.getByText('New case')).toBeInTheDocument()
  })
})

// ── Client filter ──────────────────────────────────────────────────────────────

describe('CasesTab — client filter', () => {
  it('shows only cases belonging to the given clientId', () => {
    mockCases = [
      makeCase('c1', { clientId: 'c-1' }),
      makeCase('c2', { clientId: 'c-OTHER' }),
    ]
    render(<CasesTab clientId="c-1" clientName="Ana López" onViewCase={noop} />)
    expect(screen.getByText('Case c1')).toBeInTheDocument()
    expect(screen.queryByText('Case c2')).not.toBeInTheDocument()
  })
})

// ── Sale filter ────────────────────────────────────────────────────────────────

describe('CasesTab — sale filter', () => {
  it('shows only cases belonging to the given saleId', () => {
    mockCases = [
      makeCase('s1', { clientId: 'c-1', saleId: 'sale-A' }),
      makeCase('s2', { clientId: 'c-1', saleId: 'sale-B' }),
    ]
    render(
      <CasesTab clientId="c-1" clientName="Ana López" saleId="sale-A" saleName="Seguro Hogar" onViewCase={noop} />
    )
    expect(screen.getByText('Case s1')).toBeInTheDocument()
    expect(screen.queryByText('Case s2')).not.toBeInTheDocument()
  })
})

// ── Search ─────────────────────────────────────────────────────────────────────

describe('CasesTab — search', () => {
  it('filters visible cases by search query', () => {
    mockCases = [
      makeCase('x1', { name: 'Rotura de tubería' }),
      makeCase('x2', { name: 'Avería caldera' }),
    ]
    render(<CasesTab clientId="c-1" clientName="Ana" onViewCase={noop} />)
    fireEvent.change(screen.getByTestId('search'), { target: { value: 'rotura' } })
    expect(screen.getByText('Rotura de tubería')).toBeInTheDocument()
    expect(screen.queryByText('Avería caldera')).not.toBeInTheDocument()
  })

  it('shows "No results" message when search yields nothing', () => {
    mockCases = [makeCase('x1', { name: 'Rotura de tubería' })]
    render(<CasesTab clientId="c-1" clientName="Ana" onViewCase={noop} />)
    fireEvent.change(screen.getByTestId('search'), { target: { value: 'xyz' } })
    expect(screen.getByText('No results for your search')).toBeInTheDocument()
  })
})

// ── Row click calls onViewCase ─────────────────────────────────────────────────

describe('CasesTab — row click delegates to onViewCase', () => {
  it('calls onViewCase with the case when a row is clicked', () => {
    const onViewCase = vi.fn()
    mockCases = [makeCase('d1')]
    render(<CasesTab clientId="c-1" clientName="Ana" onViewCase={onViewCase} />)
    fireEvent.click(screen.getByText('Case d1'))
    expect(onViewCase).toHaveBeenCalledOnce()
    expect(onViewCase).toHaveBeenCalledWith(expect.objectContaining({ id: 'd1' }))
  })

  it('does NOT open an inline detail view', () => {
    mockCases = [makeCase('d1')]
    render(<CasesTab clientId="c-1" clientName="Ana" onViewCase={noop} />)
    fireEvent.click(screen.getByText('Case d1'))
    expect(screen.queryByTestId('case-detail')).not.toBeInTheDocument()
  })
})

// ── New case form ──────────────────────────────────────────────────────────────

describe('CasesTab — new case form (client context)', () => {
  it('opens CaseForm with initialClientId when "New case" is clicked', () => {
    render(<CasesTab clientId="c-1" clientName="Ana" onViewCase={noop} />)
    fireEvent.click(screen.getByText('New case'))
    const form = screen.getByTestId('case-form')
    expect(form).toHaveAttribute('data-case-id', 'new')
    expect(form).toHaveAttribute('data-client-id', 'c-1')
    expect(form).not.toHaveAttribute('data-sale-id')
  })
})

describe('CasesTab — new case form (sale context)', () => {
  it('opens CaseForm with initialSaleId when "New case" is clicked with saleId prop', () => {
    render(
      <CasesTab clientId="c-1" clientName="Ana" saleId="sale-A" saleName="Seguro Hogar" onViewCase={noop} />
    )
    fireEvent.click(screen.getByText('New case'))
    const form = screen.getByTestId('case-form')
    expect(form).toHaveAttribute('data-case-id', 'new')
    expect(form).toHaveAttribute('data-sale-id', 'sale-A')
    expect(form).not.toHaveAttribute('data-client-id')
  })
})

// ── Edit pencil from list ──────────────────────────────────────────────────────

describe('CasesTab — edit pencil from list', () => {
  it('opens CaseForm directly when pencil icon is clicked in the list', () => {
    mockCases = [makeCase('p1')]
    render(<CasesTab clientId="c-1" clientName="Ana" onViewCase={noop} />)
    fireEvent.click(screen.getByTitle('Edit'))
    const form = screen.getByTestId('case-form')
    expect(form).toHaveAttribute('data-case-id', 'p1')
  })

  it('pencil click does NOT trigger onViewCase', () => {
    const onViewCase = vi.fn()
    mockCases = [makeCase('p1')]
    render(<CasesTab clientId="c-1" clientName="Ana" onViewCase={onViewCase} />)
    fireEvent.click(screen.getByTitle('Edit'))
    expect(onViewCase).not.toHaveBeenCalled()
  })
})
