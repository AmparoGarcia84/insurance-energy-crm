import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Cases from './Cases'
import type { Case } from '../../../api/cases'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'cases.title':               'Casos',
        'cases.search':              'Buscar...',
        'cases.empty':               'No hay casos',
        'cases.emptySearch':         'Sin resultados',
        'cases.columns.client':      'Cliente',
        'cases.columns.title':       'Asunto',
        'cases.columns.description': 'Descripción',
        'cases.columns.status':      'Estado',
        'cases.columns.updatedAt':   'Última actualización',
        'cases.status.OPEN':         'Abierto',
        'cases.status.IN_PROGRESS':  'En curso',
        'cases.status.RESOLVED':     'Resuelto',
        'cases.status.CLOSED':       'Cerrado',
      }
      return map[key] ?? key
    },
  }),
}))

let mockCases: Case[] = []
let mockLoading = false

vi.mock('../../../hooks/usePermissions', () => ({
  usePermissions: () => ({ canDelete: false }),
}))

vi.mock('../../../context/DataContext', () => ({
  useCases: () => ({
    cases:      mockCases,
    loading:    mockLoading,
    upsertCase: vi.fn(),
    removeCase: vi.fn(),
  }),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeCase(id: string, overrides?: Partial<Case>): Case {
  return {
    id,
    clientId:    'c-carmen',
    client:      { id: 'c-carmen', name: 'Carmen López' },
    title:       `Caso ${id}`,
    description: `Descripción del caso ${id}`,
    status:      'OPEN',
    createdAt:   '2024-01-10T10:00:00Z',
    updatedAt:   '2024-01-15T10:00:00Z',
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Cases', () => {
  beforeEach(() => {
    mockCases = []
    mockLoading = false
  })

  it('renders the page title', () => {
    render(<Cases />)
    expect(screen.getByText('Casos')).toBeInTheDocument()
  })

  it('renders the search input', () => {
    render(<Cases />)
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('shows empty state when no cases exist', () => {
    render(<Cases />)
    expect(screen.getByText('No hay casos')).toBeInTheDocument()
  })

  it('renders column headers when cases are present', () => {
    mockCases = [makeCase('1')]
    render(<Cases />)
    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(screen.getByText('Asunto')).toBeInTheDocument()
    expect(screen.getByText('Descripción')).toBeInTheDocument()
    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(screen.getByText('Última actualización')).toBeInTheDocument()
  })

  it('renders client name, title and status badge', () => {
    mockCases = [makeCase('1', { status: 'IN_PROGRESS' })]
    render(<Cases />)
    expect(screen.getByText('Carmen López')).toBeInTheDocument()
    expect(screen.getByText('Caso 1')).toBeInTheDocument()
    expect(screen.getByText('En curso')).toBeInTheDocument()
  })

  it('renders all status values correctly', () => {
    mockCases = [
      makeCase('a', { status: 'OPEN' }),
      makeCase('b', { status: 'IN_PROGRESS' }),
      makeCase('c', { status: 'RESOLVED' }),
      makeCase('d', { status: 'CLOSED' }),
    ]
    render(<Cases />)
    expect(screen.getByText('Abierto')).toBeInTheDocument()
    expect(screen.getByText('En curso')).toBeInTheDocument()
    expect(screen.getByText('Resuelto')).toBeInTheDocument()
    expect(screen.getByText('Cerrado')).toBeInTheDocument()
  })

  it('renders description text', () => {
    mockCases = [makeCase('1', { description: 'Rotura de tubería' })]
    render(<Cases />)
    expect(screen.getByText('Rotura de tubería')).toBeInTheDocument()
  })

  it('renders — when description is absent', () => {
    mockCases = [makeCase('1', { description: undefined })]
    render(<Cases />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('filters by client name', async () => {
    mockCases = [
      makeCase('1', { client: { id: 'c-1', name: 'Carmen López' }, title: 'Caso agua' }),
      makeCase('2', { client: { id: 'c-2', name: 'Antonio García' }, title: 'Caso tráfico' }),
    ]
    render(<Cases />)
    await userEvent.type(screen.getByRole('searchbox'), 'antonio')
    expect(screen.queryByText('Caso agua')).not.toBeInTheDocument()
    expect(screen.getByText('Caso tráfico')).toBeInTheDocument()
  })

  it('filters by title', async () => {
    mockCases = [
      makeCase('1', { title: 'Siniestro agua' }),
      makeCase('2', { title: 'Accidente tráfico' }),
    ]
    render(<Cases />)
    await userEvent.type(screen.getByRole('searchbox'), 'agua')
    expect(screen.getByText('Siniestro agua')).toBeInTheDocument()
    expect(screen.queryByText('Accidente tráfico')).not.toBeInTheDocument()
  })

  it('shows emptySearch when search has no matches', async () => {
    mockCases = [makeCase('1')]
    render(<Cases />)
    await userEvent.type(screen.getByRole('searchbox'), 'zzznomatch')
    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
  })

  it('renders nothing while loading', () => {
    mockLoading = true
    render(<Cases />)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText('No hay casos')).not.toBeInTheDocument()
  })
})
