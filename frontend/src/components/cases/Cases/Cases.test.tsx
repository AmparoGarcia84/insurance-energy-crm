import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Cases from './Cases'
import type { Case } from '../../../api/cases'

vi.mock('../CaseDetail/CaseDetail', () => ({ default: () => null }))
vi.mock('../CaseForm/CaseForm',     () => ({ default: () => null }))

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'cases.title':                'Casos',
        'cases.new':                  'Nuevo caso',
        'cases.search':               'Buscar...',
        'cases.empty':                'No hay casos',
        'cases.emptySearch':          'Sin resultados',
        'cases.columns.client':       'Cliente',
        'cases.columns.name':         'Nombre del caso',
        'cases.columns.status':       'Fase',
        'cases.columns.priority':     'Prioridad',
        'cases.columns.occurrenceAt': 'Fecha de ocurrencia',
        'cases.columns.updatedAt':    'Última actualización',
        'cases.status.NEW':           'Nuevo',
        'cases.status.ON_HOLD':       'En espera',
        'cases.status.FORWARDED':     'Derivado',
        'cases.status.IN_PROGRESS':   'En trámite',
        'cases.status.CLOSED':        'Cerrado',
        'cases.priority.HIGH':        'Alta',
        'cases.priority.NORMAL':      'Normal',
        'cases.priority.LOW':         'Baja',
        'cases.edit':                 'Editar',
      }
      return map[key] ?? key
    },
  }),
}))

vi.mock('../../../hooks/usePermissions', () => ({
  usePermissions: () => ({ canDelete: false }),
}))

let mockCases: Case[] = []
let mockLoading = false

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
    saleId:      's-001',
    sale:        { id: 's-001', title: 'Seguro de hogar' },
    name:        `Caso ${id}`,
    occurrenceAt: '2024-03-10T09:30:00.000Z',
    description: `Descripción del caso ${id}`,
    cause:       'Causa del caso',
    type:        'CLAIM',
    status:      'NEW',
    priority:    'NORMAL',
    supplierId:  null,
    supplier:    null,
    createdAt:   '2024-01-10T10:00:00Z',
    updatedAt:   '2024-01-15T10:00:00Z',
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Cases list', () => {
  beforeEach(() => {
    mockCases = []
    mockLoading = false
  })

  it('renders the page title', () => {
    render(<MemoryRouter initialEntries={['/cases']}><Routes><Route path="/cases/*" element={<Cases />} /></Routes></MemoryRouter>)
    expect(screen.getByText('Casos')).toBeInTheDocument()
  })

  it('renders the search input', () => {
    render(<MemoryRouter initialEntries={['/cases']}><Routes><Route path="/cases/*" element={<Cases />} /></Routes></MemoryRouter>)
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('shows empty state when no cases', () => {
    render(<MemoryRouter initialEntries={['/cases']}><Routes><Route path="/cases/*" element={<Cases />} /></Routes></MemoryRouter>)
    expect(screen.getByText('No hay casos')).toBeInTheDocument()
  })

  it('renders column headers when cases are present', () => {
    mockCases = [makeCase('1')]
    render(<MemoryRouter initialEntries={['/cases']}><Routes><Route path="/cases/*" element={<Cases />} /></Routes></MemoryRouter>)
    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(screen.getByText('Nombre del caso')).toBeInTheDocument()
    expect(screen.getByText('Fase')).toBeInTheDocument()
    expect(screen.getByText('Prioridad')).toBeInTheDocument()
    expect(screen.getByText('Fecha de ocurrencia')).toBeInTheDocument()
    expect(screen.getByText('Última actualización')).toBeInTheDocument()
  })

  it('renders client name, case name, status and priority badges', () => {
    mockCases = [makeCase('1', { status: 'IN_PROGRESS', priority: 'HIGH' })]
    render(<MemoryRouter initialEntries={['/cases']}><Routes><Route path="/cases/*" element={<Cases />} /></Routes></MemoryRouter>)
    expect(screen.getByText('Carmen López')).toBeInTheDocument()
    expect(screen.getByText('Caso 1')).toBeInTheDocument()
    expect(screen.getByText('En trámite')).toBeInTheDocument()
    expect(screen.getByText('Alta')).toBeInTheDocument()
  })

  it('renders all status values correctly', () => {
    mockCases = [
      makeCase('a', { status: 'NEW' }),
      makeCase('b', { status: 'ON_HOLD' }),
      makeCase('c', { status: 'FORWARDED' }),
      makeCase('d', { status: 'IN_PROGRESS' }),
      makeCase('e', { status: 'CLOSED' }),
    ]
    render(<MemoryRouter initialEntries={['/cases']}><Routes><Route path="/cases/*" element={<Cases />} /></Routes></MemoryRouter>)
    expect(screen.getByText('Nuevo')).toBeInTheDocument()
    expect(screen.getByText('En espera')).toBeInTheDocument()
    expect(screen.getByText('Derivado')).toBeInTheDocument()
    expect(screen.getByText('En trámite')).toBeInTheDocument()
    expect(screen.getByText('Cerrado')).toBeInTheDocument()
  })

  it('renders — when occurrenceAt is absent', () => {
    mockCases = [makeCase('1', { occurrenceAt: null })]
    render(<MemoryRouter initialEntries={['/cases']}><Routes><Route path="/cases/*" element={<Cases />} /></Routes></MemoryRouter>)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('filters by client name', async () => {
    mockCases = [
      makeCase('1', { client: { id: 'c-1', name: 'Carmen López' }, name: 'Caso agua' }),
      makeCase('2', { client: { id: 'c-2', name: 'Antonio García' }, name: 'Caso tráfico' }),
    ]
    render(<MemoryRouter initialEntries={['/cases']}><Routes><Route path="/cases/*" element={<Cases />} /></Routes></MemoryRouter>)
    await userEvent.type(screen.getByRole('searchbox'), 'antonio')
    expect(screen.queryByText('Caso agua')).not.toBeInTheDocument()
    expect(screen.getByText('Caso tráfico')).toBeInTheDocument()
  })

  it('filters by case name', async () => {
    mockCases = [
      makeCase('1', { name: 'Siniestro agua' }),
      makeCase('2', { name: 'Accidente tráfico' }),
    ]
    render(<MemoryRouter initialEntries={['/cases']}><Routes><Route path="/cases/*" element={<Cases />} /></Routes></MemoryRouter>)
    await userEvent.type(screen.getByRole('searchbox'), 'agua')
    expect(screen.getByText('Siniestro agua')).toBeInTheDocument()
    expect(screen.queryByText('Accidente tráfico')).not.toBeInTheDocument()
  })

  it('shows emptySearch when search has no matches', async () => {
    mockCases = [makeCase('1')]
    render(<MemoryRouter initialEntries={['/cases']}><Routes><Route path="/cases/*" element={<Cases />} /></Routes></MemoryRouter>)
    await userEvent.type(screen.getByRole('searchbox'), 'zzznomatch')
    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
  })

  it('renders nothing while loading', () => {
    mockLoading = true
    render(<MemoryRouter initialEntries={['/cases']}><Routes><Route path="/cases/*" element={<Cases />} /></Routes></MemoryRouter>)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText('No hay casos')).not.toBeInTheDocument()
  })
})
