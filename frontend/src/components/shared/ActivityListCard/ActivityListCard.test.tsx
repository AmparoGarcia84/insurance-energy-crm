import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ActivityListCard, { relativeDate, type ActivityItem } from './ActivityListCard'

// relativeDate is exported so ClientSummaryTab can import it if needed
describe('relativeDate', () => {
  it('returns "ahora" for very recent dates', () => {
    expect(relativeDate(new Date().toISOString())).toBe('ahora')
  })

  it('returns "ayer" for dates 24-48h ago', () => {
    const d = new Date(Date.now() - 25 * 3600 * 1000).toISOString()
    expect(relativeDate(d)).toBe('ayer')
  })

  it('returns relative days for dates within the last month', () => {
    const d = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    expect(relativeDate(d)).toBe('hace 5 días')
  })
})

const items: ActivityItem[] = [
  { id: 'a1', type: 'CALL', subject: 'Seguimiento renovación', date: new Date().toISOString(), context: 'Ana Martínez' },
  { id: 'a2', type: 'EMAIL', subject: 'Envío documentación', date: new Date(Date.now() - 86400000).toISOString() },
]

describe('ActivityListCard', () => {
  it('renders the title', () => {
    render(<ActivityListCard title="Actividad reciente" items={[]} emptyLabel="Sin actividad" />)
    expect(screen.getByText('Actividad reciente')).toBeInTheDocument()
  })

  it('renders empty label when no items', () => {
    render(<ActivityListCard title="Actividad" items={[]} emptyLabel="Sin actividad registrada" />)
    expect(screen.getByText('Sin actividad registrada')).toBeInTheDocument()
  })

  it('renders all activity subjects', () => {
    render(<ActivityListCard title="Actividad" items={items} emptyLabel="Sin actividad" />)
    expect(screen.getByText('Seguimiento renovación')).toBeInTheDocument()
    expect(screen.getByText('Envío documentación')).toBeInTheDocument()
  })

  it('renders context when provided', () => {
    render(<ActivityListCard title="Actividad" items={items} emptyLabel="Sin actividad" />)
    const contextEls = document.querySelectorAll('.alc__context')
    const texts = Array.from(contextEls).map(el => el.textContent ?? '')
    expect(texts.some(t => t.includes('Ana Martínez'))).toBe(true)
  })

  it('does not render context when not provided', () => {
    const noContextItems: ActivityItem[] = [
      { id: 'a1', type: 'CALL', subject: 'Prueba', date: new Date().toISOString() },
    ]
    render(<ActivityListCard title="Actividad" items={noContextItems} emptyLabel="Sin actividad" />)
    expect(document.querySelectorAll('.alc__context').length).toBe(0)
  })

  it('uses relative date format by default', () => {
    render(<ActivityListCard title="Actividad" items={[{ id: 'a1', type: 'CALL', subject: 'Prueba', date: new Date().toISOString() }]} emptyLabel="Sin actividad" />)
    expect(screen.getByText('ahora')).toBeInTheDocument()
  })

  it('uses absolute date format when dateFormat="absolute"', () => {
    const fixedDate = new Date('2025-04-15T10:00:00Z').toISOString()
    render(
      <ActivityListCard
        title="Actividad"
        items={[{ id: 'a1', type: 'CALL', subject: 'Prueba', date: fixedDate }]}
        emptyLabel="Sin actividad"
        dateFormat="absolute"
      />
    )
    // Should render a date like "15 abr" not "ahora"
    expect(screen.queryByText('ahora')).not.toBeInTheDocument()
  })

  it('renders one icon per activity item', () => {
    render(<ActivityListCard title="Actividad" items={items} emptyLabel="Sin actividad" />)
    const icons = document.querySelectorAll('.alc__icon')
    expect(icons.length).toBe(items.length)
  })

  it('applies extra className to root element', () => {
    render(<ActivityListCard title="Actividad" items={[]} emptyLabel="Sin actividad" className="my-extra" />)
    expect(document.querySelector('.my-extra')).toBeTruthy()
  })

  it('suppresses console errors for unknown icon types', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const unknownType: ActivityItem[] = [{ id: 'x', type: 'UNKNOWN_TYPE', subject: 'Prueba', date: new Date().toISOString() }]
    render(<ActivityListCard title="Actividad" items={unknownType} emptyLabel="Sin actividad" />)
    consoleSpy.mockRestore()
    // Should render without crashing (falls back to Pencil icon)
    expect(screen.getByText('Prueba')).toBeInTheDocument()
  })
})
