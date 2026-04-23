import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../i18n'
import TaskTable from './TaskTable'
import { TaskStatus, TaskPriority } from '../../../api/tasks'
import type { TaskWithRelations } from '../../../api/tasks'

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-owner', role: 'OWNER', displayName: 'Mila' } }),
}))

const STUB_TASK: TaskWithRelations = {
  id:          'task-001',
  clientId:    'c-1',
  subject:     'Call client back',
  description: 'Follow up',
  status:      TaskStatus.NOT_STARTED,
  priority:    TaskPriority.HIGH,
  dueDate:     null,
  hasReminder: false,
  assignedTo:  { id: 'u-owner', displayName: 'Mila', email: 'mila@crm.com' },
  client:      { id: 'c-1', name: 'Acme Corp', clientNumber: '001' },
  createdAt:   '2026-04-21T10:00:00.000Z',
  updatedAt:   '2026-04-21T10:00:00.000Z',
}

const noop = vi.fn()

function renderTable(tasks: TaskWithRelations[], opts: { canDelete?: boolean; showClient?: boolean } = {}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <TaskTable
        tasks={tasks}
        canDelete={opts.canDelete ?? true}
        showClient={opts.showClient}
        onStatusChange={noop}
        onEdit={noop}
        onDelete={noop}
      />
    </I18nextProvider>
  )
}

describe('TaskTable', () => {
  it('renders task subject', () => {
    renderTable([STUB_TASK])
    expect(screen.getByText('Call client back')).toBeInTheDocument()
  })

  it('renders status selector with current value', () => {
    renderTable([STUB_TASK])
    const select = screen.getByRole('combobox')
    expect((select as HTMLSelectElement).value).toBe(TaskStatus.NOT_STARTED)
  })

  it('calls onStatusChange when selector changes', () => {
    const onStatusChange = vi.fn()
    render(
      <I18nextProvider i18n={i18n}>
        <TaskTable
          tasks={[STUB_TASK]}
          canDelete={true}
          onStatusChange={onStatusChange}
          onEdit={noop}
          onDelete={noop}
        />
      </I18nextProvider>
    )
    fireEvent.change(screen.getByRole('combobox'), { target: { value: TaskStatus.IN_PROGRESS } })
    expect(onStatusChange).toHaveBeenCalledWith(STUB_TASK, TaskStatus.IN_PROGRESS)
  })

  it('renders priority badge', () => {
    renderTable([STUB_TASK])
    expect(screen.getByText(/alta|high/i)).toBeInTheDocument()
  })

  it('shows assigned user name', () => {
    renderTable([STUB_TASK])
    expect(screen.getByText('Mila')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(
      <I18nextProvider i18n={i18n}>
        <TaskTable
          tasks={[STUB_TASK]}
          canDelete={true}
          onStatusChange={noop}
          onEdit={onEdit}
          onDelete={noop}
        />
      </I18nextProvider>
    )
    fireEvent.click(screen.getByTitle(/editar|edit/i))
    expect(onEdit).toHaveBeenCalledWith(STUB_TASK)
  })

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    render(
      <I18nextProvider i18n={i18n}>
        <TaskTable
          tasks={[STUB_TASK]}
          canDelete={true}
          onStatusChange={noop}
          onEdit={noop}
          onDelete={onDelete}
        />
      </I18nextProvider>
    )
    fireEvent.click(screen.getByTitle(/eliminar|delete/i))
    expect(onDelete).toHaveBeenCalledWith(STUB_TASK)
  })

  it('hides delete button when canDelete is false', () => {
    renderTable([STUB_TASK], { canDelete: false })
    expect(screen.queryByTitle(/eliminar|delete/i)).not.toBeInTheDocument()
  })

  it('shows client column when showClient is true', () => {
    renderTable([STUB_TASK], { showClient: true })
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('hides client column by default', () => {
    renderTable([STUB_TASK])
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument()
  })

  it('applies done style to completed task subject', () => {
    const done = { ...STUB_TASK, status: TaskStatus.COMPLETED }
    renderTable([done])
    const subject = screen.getByText('Call client back')
    expect(subject.className).toContain('tt-subject--done')
  })

  it('applies overdue style when task is past due and not completed', () => {
    const overdue = { ...STUB_TASK, dueDate: '2020-01-01T00:00:00.000Z' }
    renderTable([overdue])
    const subject = screen.getByText('Call client back')
    expect(subject.className).toContain('tt-subject--overdue')
  })

  it('renders multiple rows', () => {
    renderTable([
      STUB_TASK,
      { ...STUB_TASK, id: 'task-002', subject: 'Send documents' },
    ])
    expect(screen.getByText('Call client back')).toBeInTheDocument()
    expect(screen.getByText('Send documents')).toBeInTheDocument()
  })
})
