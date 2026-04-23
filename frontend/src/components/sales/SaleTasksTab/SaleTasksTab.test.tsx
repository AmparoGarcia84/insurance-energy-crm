import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../i18n'
import SaleTasksTab from './SaleTasksTab'
import * as tasksApi from '../../../api/tasks'
import { TaskStatus, TaskPriority, RelatedEntityType } from '../../../api/tasks'
import * as usersApi from '../../../api/users'

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-owner', role: 'OWNER', displayName: 'Mila' } }),
}))

vi.mock('../../../api/tasks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/tasks')>()
  return {
    ...actual,
    getTasks:    vi.fn(),
    createTask:  vi.fn(),
    updateTask:  vi.fn(),
    deleteTask:  vi.fn(),
  }
})

vi.mock('../../../api/users', () => ({
  getUsers: vi.fn().mockResolvedValue([]),
}))

const mockGetTasks   = vi.mocked(tasksApi.getTasks)
const mockUpdateTask = vi.mocked(tasksApi.updateTask)
const mockDeleteTask = vi.mocked(tasksApi.deleteTask)

const STUB_TASK: tasksApi.TaskWithRelations = {
  id:                'task-001',
  subject:           'Send proposal',
  description:       undefined,
  status:            TaskStatus.NOT_STARTED,
  priority:          TaskPriority.NORMAL,
  relatedEntityType: RelatedEntityType.SALE,
  relatedEntityId:   's-1',
  clientId:          'c-1',
  dueDate:           undefined,
  assignedToUserId:  undefined,
  hasReminder:       false,
  createdAt:         '2026-04-21T10:00:00.000Z',
  updatedAt:         '2026-04-21T10:00:00.000Z',
}

function renderTab() {
  return render(
    <I18nextProvider i18n={i18n}>
      <SaleTasksTab saleId="s-1" clientId="c-1" />
    </I18nextProvider>
  )
}

beforeEach(() => vi.clearAllMocks())

describe('SaleTasksTab', () => {
  it('loads tasks filtered by saleId and relatedEntityType', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTab()
    await waitFor(() => {
      expect(mockGetTasks).toHaveBeenCalledWith({
        relatedEntityType: RelatedEntityType.SALE,
        relatedEntityId:   's-1',
      })
    })
  })

  it('renders task row in the table', async () => {
    mockGetTasks.mockResolvedValue([STUB_TASK])
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('Send proposal')).toBeInTheDocument()
    })
  })

  it('renders status select with all TaskStatus options for each task', async () => {
    mockGetTasks.mockResolvedValue([STUB_TASK])
    renderTab()
    await waitFor(() => screen.getByText('Send proposal'))

    const select = screen.getByRole<HTMLSelectElement>('combobox', { name: i18n.t('tasks.form.status') })
    expect(select).toBeInTheDocument()

    for (const status of Object.values(TaskStatus)) {
      expect(
        screen.getByRole('option', { name: i18n.t(`tasks.status.${status}`) })
      ).toBeInTheDocument()
    }
  })

  it('filters tasks by search term', async () => {
    mockGetTasks.mockResolvedValue([
      STUB_TASK,
      { ...STUB_TASK, id: 'task-002', subject: 'Follow up call', status: TaskStatus.IN_PROGRESS },
    ])
    renderTab()
    await waitFor(() => screen.getByText('Send proposal'))

    const input = screen.getByPlaceholderText(/buscar|search/i)
    fireEvent.change(input, { target: { value: 'follow' } })

    expect(screen.queryByText('Send proposal')).not.toBeInTheDocument()
    expect(screen.getByText('Follow up call')).toBeInTheDocument()
  })

  it('shows TaskForm view when "New task" button is clicked', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTab()
    const newBtn = await screen.findByRole('button', { name: /nueva tarea|new task/i })
    fireEvent.click(newBtn)

    expect(screen.queryByRole('button', { name: /nueva tarea|new task/i })).not.toBeInTheDocument()
    expect(screen.getByLabelText(/asunto|subject/i)).toBeInTheDocument()
  })

  it('returns to table when cancel is clicked in form view', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTab()
    await waitFor(() => screen.getByRole('button', { name: /nueva tarea|new task/i }))

    fireEvent.click(screen.getByRole('button', { name: /nueva tarea|new task/i }))
    expect(screen.getByLabelText(/asunto|subject/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/cancelar|cancel/i))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /nueva tarea|new task/i })).toBeInTheDocument()
    })
  })

  it('shows TaskForm pre-filled when edit button is clicked', async () => {
    mockGetTasks.mockResolvedValue([STUB_TASK])
    renderTab()
    await waitFor(() => screen.getByText('Send proposal'))

    fireEvent.click(screen.getByTitle(/editar|edit/i))

    const subjectInput = screen.getByLabelText<HTMLInputElement>(/asunto|subject/i)
    expect(subjectInput.value).toBe('Send proposal')
  })

  it('calls updateTask when status is changed via the select', async () => {
    mockGetTasks.mockResolvedValue([STUB_TASK])
    mockUpdateTask.mockResolvedValue({ ...STUB_TASK, status: TaskStatus.COMPLETED })
    renderTab()
    await waitFor(() => screen.getByText('Send proposal'))

    const select = screen.getByRole('combobox', { name: i18n.t('tasks.form.status') })
    fireEvent.change(select, { target: { value: TaskStatus.COMPLETED } })

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith('task-001', { status: TaskStatus.COMPLETED })
    })
  })

  it('shows delete button for OWNER', async () => {
    mockGetTasks.mockResolvedValue([STUB_TASK])
    renderTab()
    await waitFor(() => screen.getByText('Send proposal'))
    expect(screen.getByTitle(/eliminar|delete/i)).toBeInTheDocument()
  })

  it('removes task from table after deletion', async () => {
    mockGetTasks.mockResolvedValue([STUB_TASK])
    mockDeleteTask.mockResolvedValue(undefined)
    renderTab()
    await waitFor(() => screen.getByText('Send proposal'))

    fireEvent.click(screen.getByTitle(/eliminar|delete/i))
    const confirmBtn = screen.getAllByText(/eliminar|delete/i).find(
      (el) => el.tagName === 'BUTTON' && el.closest('.modal')
    )
    if (confirmBtn) fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.queryByText('Send proposal')).not.toBeInTheDocument()
    })
  })

  it('fetches users on mount for the form', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTab()
    await waitFor(() => {
      expect(vi.mocked(usersApi.getUsers)).toHaveBeenCalled()
    })
  })
})
