import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GlobalSearch from './GlobalSearch'
import type { Client } from '../../../api/clients'
import type { Sale } from '../../../api/sales'
import type { Case } from '../../../api/cases'
import { ClientType, ClientStatus } from '@crm/shared'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CLIENTS: Client[] = [
  {
    id: 'c-001', clientNumber: '000001', name: 'Ana García',
    type: ClientType.INDIVIDUAL, status: ClientStatus.ACTIVE,
    mobilePhone: '600111222',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c-002', clientNumber: '000002', name: 'Blas López',
    type: ClientType.BUSINESS, status: ClientStatus.LEAD,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
]

const SALES: Sale[] = [
  {
    id: 's-001', title: 'Hogar Ana García', type: 'INSURANCE' as never,
    clientId: 'c-001', clientName: 'Ana García',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  } as Sale,
  {
    id: 's-002', title: 'Luz oficina López', type: 'ENERGY' as never,
    clientId: 'c-002', clientName: 'Blas López',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  } as Sale,
]

const CASES: Case[] = [
  {
    id: 'ca-001', clientId: 'c-002', name: 'Reclamación siniestro',
    client: { id: 'c-002', name: 'Blas López' },
    status: 'NEW', priority: 'HIGH',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
]

vi.mock('../../../context/DataContext', () => ({
  useClients: () => ({ clients: CLIENTS, loading: false }),
  useSales:   () => ({ sales: SALES,   loading: false }),
  useCases:   () => ({ cases: CASES,   loading: false }),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderSearch(overrides: Partial<Parameters<typeof GlobalSearch>[0]> = {}) {
  const props = {
    onOpenClient: vi.fn(),
    onOpenSale:   vi.fn(),
    onOpenCase:   vi.fn(),
    ...overrides,
  }
  return { ...props, ...render(<GlobalSearch {...props} />) }
}

function type(text: string) {
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: text } })
}

beforeEach(() => vi.clearAllMocks())

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('GlobalSearch — rendering', () => {
  it('renders a search input', () => {
    renderSearch()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('does not show dropdown when query is empty', () => {
    renderSearch()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('does not show dropdown when query is shorter than 2 characters', () => {
    renderSearch()
    type('a')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('shows dropdown when query is 2 or more characters', () => {
    renderSearch()
    type('an')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })
})

// ── Client results ────────────────────────────────────────────────────────────

describe('GlobalSearch — client results', () => {
  it('shows matching client by name', () => {
    renderSearch()
    type('ana')
    // item-main is unique; item-sub shows the client number
    expect(screen.getByText('Ana García', { selector: '.global-search__item-main' })).toBeInTheDocument()
    expect(screen.queryByText('Blas López', { selector: '.global-search__item-main' })).not.toBeInTheDocument()
  })

  it('shows matching client by client number', () => {
    renderSearch()
    type('000002')
    expect(screen.getByText('Blas López', { selector: '.global-search__item-main' })).toBeInTheDocument()
    expect(screen.queryByText('Ana García', { selector: '.global-search__item-main' })).not.toBeInTheDocument()
  })

  it('shows matching client by mobile phone', () => {
    renderSearch()
    type('600111')
    expect(screen.getByText('Ana García', { selector: '.global-search__item-main' })).toBeInTheDocument()
  })

  it('calls onOpenClient with the correct id when a client result is clicked', () => {
    const { onOpenClient } = renderSearch()
    type('000001')
    const btn = screen.getByText('Ana García', { selector: '.global-search__item-main' }).closest('button')!
    fireEvent.click(btn)
    expect(onOpenClient).toHaveBeenCalledWith('c-001')
  })

  it('clears the query after selecting a client', () => {
    renderSearch()
    type('000001')
    const btn = screen.getByText('Ana García', { selector: '.global-search__item-main' }).closest('button')!
    fireEvent.click(btn)
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })
})

// ── Sale results ──────────────────────────────────────────────────────────────

describe('GlobalSearch — sale results', () => {
  it('shows matching sale by title', () => {
    renderSearch()
    type('hogar')
    expect(screen.getByText('Hogar Ana García')).toBeInTheDocument()
  })

  it('shows matching sale by client name', () => {
    renderSearch()
    type('blas')
    expect(screen.getByText('Luz oficina López')).toBeInTheDocument()
  })

  it('calls onOpenSale with the correct id when a sale result is clicked', () => {
    const { onOpenSale } = renderSearch()
    type('hogar')
    fireEvent.click(screen.getByText('Hogar Ana García'))
    expect(onOpenSale).toHaveBeenCalledWith('s-001')
  })
})

// ── Case results ──────────────────────────────────────────────────────────────

describe('GlobalSearch — case results', () => {
  it('shows matching case by name', () => {
    renderSearch()
    type('recla')
    expect(screen.getByText('Reclamación siniestro')).toBeInTheDocument()
  })

  it('shows matching case by client name', () => {
    renderSearch()
    type('blas')
    expect(screen.getByText('Reclamación siniestro')).toBeInTheDocument()
  })

  it('calls onOpenCase with the correct id when a case result is clicked', () => {
    const { onOpenCase } = renderSearch()
    type('recla')
    fireEvent.click(screen.getByText('Reclamación siniestro'))
    expect(onOpenCase).toHaveBeenCalledWith('ca-001')
  })
})

// ── Empty state ───────────────────────────────────────────────────────────────

describe('GlobalSearch — empty state', () => {
  it('shows empty message when no results match', () => {
    renderSearch()
    type('zzzzz')
    expect(screen.getByText('topbar.searchEmpty')).toBeInTheDocument()
  })
})

// ── Keyboard ──────────────────────────────────────────────────────────────────

describe('GlobalSearch — keyboard', () => {
  it('closes the dropdown on Escape', () => {
    renderSearch()
    type('ana')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
