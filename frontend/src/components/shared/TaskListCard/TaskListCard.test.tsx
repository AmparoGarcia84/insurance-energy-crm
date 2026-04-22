import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TaskListCard, { type TaskItem } from './TaskListCard'

const tomorrow = new Date(Date.now() + 86400000).toISOString()
const yesterday = new Date(Date.now() - 86400000).toISOString()

const items: TaskItem[] = [
  { id: '1', subject: 'Llamar a cliente', priority: 'HIGH', dueDate: tomorrow, meta: 'Mila' },
  { id: '2', subject: 'Enviar presupuesto', priority: 'NORMAL', dueDate: null, meta: null },
  { id: '3', subject: 'Revisar póliza', priority: 'HIGHEST', dueDate: yesterday, meta: 'Ana' },
]

describe('TaskListCard', () => {
  it('renders the title', () => {
    render(<TaskListCard title="Tareas pendientes" items={[]} emptyLabel="Sin tareas" />)
    expect(screen.getByText('Tareas pendientes')).toBeInTheDocument()
  })

  it('renders empty label when no items', () => {
    render(<TaskListCard title="Tareas" items={[]} emptyLabel="Sin tareas pendientes" />)
    expect(screen.getByText('Sin tareas pendientes')).toBeInTheDocument()
  })

  it('renders all task subjects', () => {
    render(<TaskListCard title="Tareas" items={items} emptyLabel="Sin tareas" />)
    expect(screen.getByText('Llamar a cliente')).toBeInTheDocument()
    expect(screen.getByText('Enviar presupuesto')).toBeInTheDocument()
    expect(screen.getByText('Revisar póliza')).toBeInTheDocument()
  })

  it('renders meta text when provided', () => {
    render(<TaskListCard title="Tareas" items={items} emptyLabel="Sin tareas" />)
    expect(screen.getByText('Mila')).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
  })

  it('shows count badge when count prop is provided', () => {
    render(<TaskListCard title="Tareas" items={items} emptyLabel="Sin tareas" count={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('hides count badge when count is 0', () => {
    render(<TaskListCard title="Tareas" items={items} emptyLabel="Sin tareas" count={0} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('renders noDueDateLabel for tasks without a due date', () => {
    render(<TaskListCard title="Tareas" items={items} emptyLabel="Sin tareas" noDueDateLabel="Sin fecha" />)
    expect(screen.getByText('Sin fecha')).toBeInTheDocument()
  })

  it('does not render due date column for no-date tasks when noDueDateLabel is omitted', () => {
    render(<TaskListCard title="Tareas" items={items} emptyLabel="Sin tareas" />)
    expect(screen.queryByText('Sin fecha')).not.toBeInTheDocument()
  })

  it('applies overdue style to past due dates', () => {
    render(<TaskListCard title="Tareas" items={items} emptyLabel="Sin tareas" />)
    const dueEls = document.querySelectorAll('.tlc__due--overdue')
    expect(dueEls.length).toBe(1) // only the yesterday task
  })

  it('renders priority dots for each item', () => {
    render(<TaskListCard title="Tareas" items={items} emptyLabel="Sin tareas" />)
    const dots = document.querySelectorAll('.tlc__priority')
    expect(dots.length).toBe(items.length)
  })

  it('applies extra className to root element', () => {
    render(<TaskListCard title="Tareas" items={[]} emptyLabel="Sin tareas" className="extra-class" />)
    expect(document.querySelector('.extra-class')).toBeTruthy()
  })
})
