import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../i18n'
import ClientTasksTab from './ClientTasksTab'
import * as tasksApi from '../../../api/tasks'
import { TaskStatus, TaskPriority } from '../../../api/tasks'
import * as usersApi from '../../../api/users'

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-owner', role: 'OWNER', displayName: 'Mila' } }),
}))

vi.mock('../../../api/tasks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/tasks')>()
  return {
    ...actual,
    getTasks:   vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  }
})

vi.mock('../../../api/users', () => ({
  getUsers: vi.fn().mockResolvedValue([]),
}))

const mockGetTasks   = vi.mocked(tasksApi.getTasks)
const mockCreateTask = vi.mocked(tasksApi.createTask)
const mockUpdateTask = vi.mocked(tasksApi.updateTask)
const mockDeleteTask = vi.mocked(tasksApi.deleteTask)

const STUB_TASK = {
  id:          'task-001',
  clientId:    'c-1',
  subject:     'Call client back',
  description: 'Follow up on quote',
  status:      TaskStatus.NOT_STARTED,
  priority:    TaskPriority.NORMAL,
  dueDate:     null,
  hasReminder: false,
  assignedTo:  { id: 'u-owner', displayName: 'Mila', email: 'mila@crm.com' },
  createdAt:   '2026-04-21T10:00:00.000Z',
  updatedAt:   '2026-04-21T10:00:00.000Z',
}

function renderTab() {
  return render(
    <I18nextProvider i18n={i18n}>
      <ClientTasksTab clientId="c-1" />
    </I18nextProvider>
  )
}

beforeEach(() => vi.clearAllMocks())

describe('ClientTasksTab', () => {
  it('shows empty state when there are no tasks', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTab()
    await waitFor(() => {
      expect(screen.getByText(/sin tareas|no tasks/i)).toBeInTheDocument()
    })
  })

  it('renders tasks in a table', async () => {
    mockGetTasks.mockResolvedValue([STUB_TASK])
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('Call client back')).toBeInTheDocument()
    })
  })

  it('loads tasks filtered by clientId', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTab()
    await waitFor(() => {
      expect(mockGetTasks).toHaveBeenCalledWith({ clientId: 'c-1' })
    })
  })

  it('filters tasks by search term', async () => {
    mockGetTasks.mockResolvedValue([
      STUB_TASK,
      { ...STUB_TASK, id: 'task-002', subject: 'Send policy documents' },
    ])
    renderTab()
    await waitFor(() => screen.getByText('Call client back'))

    const input = screen.getByPlaceholderText(/buscar|search/i)
    fireEvent.change(input, { target: { value: 'policy' } })

    expect(screen.queryByText('Call client back')).not.toBeInTheDocument()
    expect(screen.getByText('Send policy documents')).toBeInTheDocument()
  })

  it('shows the form when "New task" is clicked', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTab()
    await waitFor(() => screen.getByText(/nueva tarea|new task/i))

    fireEvent.click(screen.getByText(/nueva tarea|new task/i))
    expect(screen.getByLabelText(/asunto|subject/i)).toBeInTheDocument()
  })

  it('renders the status selector for each row', async () => {
    mockGetTasks.mockResolvedValue([STUB_TASK])
    renderTab()
    await waitFor(() => screen.getByText('Call client back'))

    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect((select as HTMLSelectElement).value).toBe(TaskStatus.NOT_STARTED)
  })

  it('calls updateTask when status is changed inline', async () => {
    mockGetTasks.mockResolvedValue([STUB_TASK])
    mockUpdateTask.mockResolvedValue({ ...STUB_TASK, status: TaskStatus.IN_PROGRESS })
    renderTab()
    await waitFor(() => screen.getByText('Call client back'))

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: TaskStatus.IN_PROGRESS } })

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith('task-001', { status: TaskStatus.IN_PROGRESS })
    })
  })

  it('adds a new task to the table after save', async () => {
    mockGetTasks.mockResolvedValue([])
    mockCreateTask.mockResolvedValue(STUB_TASK)
    renderTab()
    await waitFor(() => screen.getByText(/nueva tarea|new task/i))

    fireEvent.click(screen.getByText(/nueva tarea|new task/i))
    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'Call client back' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar|save/i }))

    await waitFor(() => {
      expect(screen.getByText('Call client back')).toBeInTheDocument()
    })
  })

  it('shows delete button only for OWNER', async () => {
    mockGetTasks.mockResolvedValue([STUB_TASK])
    renderTab()
    await waitFor(() => screen.getByText('Call client back'))
    expect(screen.getByTitle(/eliminar|delete/i)).toBeInTheDocument()
  })

  it('removes task from table after deletion', async () => {
    mockGetTasks.mockResolvedValue([STUB_TASK])
    mockDeleteTask.mockResolvedValue(undefined)
    renderTab()
    await waitFor(() => screen.getByText('Call client back'))

    fireEvent.click(screen.getByTitle(/eliminar|delete/i))
    const confirmBtn = screen.getAllByText(/eliminar|delete/i).find(
      (el) => el.tagName === 'BUTTON' && el.closest('.modal')
    )
    if (confirmBtn) fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.queryByText('Call client back')).not.toBeInTheDocument()
    })
  })

  it('shows edit form pre-filled when edit button is clicked', async () => {
    mockGetTasks.mockResolvedValue([STUB_TASK])
    renderTab()
    await waitFor(() => screen.getByText('Call client back'))

    fireEvent.click(screen.getByTitle(/editar|edit/i))
    expect(screen.getByLabelText<HTMLInputElement>(/asunto|subject/i).value).toBe('Call client back')
  })

  it('shows no search input when task list is empty', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTab()
    await waitFor(() => screen.getByText(/sin tareas|no tasks/i))
    expect(screen.queryByPlaceholderText(/buscar|search/i)).not.toBeInTheDocument()
  })

  it('fetches users for the task form', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTab()
    await waitFor(() => {
      expect(vi.mocked(usersApi.getUsers)).toHaveBeenCalled()
    })
  })
})
