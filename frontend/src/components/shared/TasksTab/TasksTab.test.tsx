import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../i18n'
import TasksTab from './TasksTab'
import * as tasksApi from '../../../api/tasks'
import { TaskStatus, TaskPriority } from '../../../api/tasks'
import * as usersApi from '../../../api/users'
import type { TaskFormContext } from '../TaskForm/TaskForm'

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

vi.mock('../../../api/users',   () => ({ getUsers:   vi.fn().mockResolvedValue([]) }))
vi.mock('../../../api/clients', () => ({ getClients: vi.fn().mockResolvedValue([]), getClient: vi.fn() }))
vi.mock('../../../api/sales',   () => ({ getSales:   vi.fn().mockResolvedValue([]) }))
vi.mock('../../../api/cases',   () => ({ getCases:   vi.fn().mockResolvedValue([]) }))
vi.mock('../../../api/suppliers',() => ({ getSuppliers: vi.fn().mockResolvedValue([]) }))

const mockGetTasks   = vi.mocked(tasksApi.getTasks)
const mockUpdateTask = vi.mocked(tasksApi.updateTask)
const mockDeleteTask = vi.mocked(tasksApi.deleteTask)

const BASE_TASK: tasksApi.TaskWithRelations = {
  id:          'task-001',
  subject:     'Call client back',
  description: undefined,
  status:      TaskStatus.NOT_STARTED,
  priority:    TaskPriority.NORMAL,
  clientId:    'c-1',
  dueDate:     undefined,
  assignedToUserId: undefined,
  hasReminder: false,
  createdAt:   '2026-04-21T10:00:00.000Z',
  updatedAt:   '2026-04-21T10:00:00.000Z',
}

beforeEach(() => vi.clearAllMocks())

// ── Filter derivation ─────────────────────────────────────────────────────────

describe('TasksTab — filter derivation from context', () => {
  it('filters by clientId when only client is locked', async () => {
    mockGetTasks.mockResolvedValue([])
    const ctx: TaskFormContext = { lockedClientId: 'c-1', lockedClientName: 'Acme' }
    render(<I18nextProvider i18n={i18n}><TasksTab context={ctx} /></I18nextProvider>)
    await waitFor(() => expect(mockGetTasks).toHaveBeenCalledWith({ clientId: 'c-1' }))
  })

  it('filters by saleId when sale is locked', async () => {
    mockGetTasks.mockResolvedValue([])
    const ctx: TaskFormContext = { lockedClientId: 'c-1', lockedClientName: 'Acme', lockedSaleId: 's-1', lockedSaleName: 'Sale A' }
    render(<I18nextProvider i18n={i18n}><TasksTab context={ctx} /></I18nextProvider>)
    await waitFor(() => expect(mockGetTasks).toHaveBeenCalledWith({ saleId: 's-1' }))
  })

  it('filters by caseId when case is locked (highest priority)', async () => {
    mockGetTasks.mockResolvedValue([])
    const ctx: TaskFormContext = { lockedClientId: 'c-1', lockedClientName: 'Acme', lockedCaseId: 'case-1', lockedCaseName: 'Case A' }
    render(<I18nextProvider i18n={i18n}><TasksTab context={ctx} /></I18nextProvider>)
    await waitFor(() => expect(mockGetTasks).toHaveBeenCalledWith({ caseId: 'case-1' }))
  })
})

// ── Shared UI behaviour ───────────────────────────────────────────────────────

describe('TasksTab — UI behaviour', () => {
  const CTX: TaskFormContext = { lockedClientId: 'c-1', lockedClientName: 'Acme Corp' }

  function renderTab() {
    return render(<I18nextProvider i18n={i18n}><TasksTab context={CTX} /></I18nextProvider>)
  }

  it('shows empty state when no tasks', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTab()
    await waitFor(() =>
      expect(screen.getByText(/sin tareas|no tasks/i)).toBeInTheDocument()
    )
  })

  it('renders task rows', async () => {
    mockGetTasks.mockResolvedValue([BASE_TASK])
    renderTab()
    await waitFor(() => expect(screen.getByText('Call client back')).toBeInTheDocument())
  })

  it('filters by search term', async () => {
    mockGetTasks.mockResolvedValue([
      BASE_TASK,
      { ...BASE_TASK, id: 'task-002', subject: 'Send documents' },
    ])
    renderTab()
    await waitFor(() => screen.getByText('Call client back'))
    fireEvent.change(screen.getByPlaceholderText(/buscar|search/i), { target: { value: 'send' } })
    expect(screen.queryByText('Call client back')).not.toBeInTheDocument()
    expect(screen.getByText('Send documents')).toBeInTheDocument()
  })

  it('opens TaskForm when "New task" is clicked', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTab()
    await waitFor(() => screen.getByRole('button', { name: /nueva tarea|new task/i }))
    fireEvent.click(screen.getByRole('button', { name: /nueva tarea|new task/i }))
    expect(screen.getByLabelText(/asunto|subject/i)).toBeInTheDocument()
  })

  it('returns to table when cancel is clicked in form', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTab()
    await waitFor(() => screen.getByRole('button', { name: /nueva tarea|new task/i }))
    fireEvent.click(screen.getByRole('button', { name: /nueva tarea|new task/i }))
    fireEvent.click(screen.getByText(/cancelar|cancel/i))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /nueva tarea|new task/i })).toBeInTheDocument()
    )
  })

  it('opens edit form pre-filled', async () => {
    mockGetTasks.mockResolvedValue([BASE_TASK])
    renderTab()
    await waitFor(() => screen.getByText('Call client back'))
    fireEvent.click(screen.getByTitle(/editar|edit/i))
    expect(screen.getByLabelText<HTMLInputElement>(/asunto|subject/i).value).toBe('Call client back')
  })

  it('calls updateTask on status change', async () => {
    mockGetTasks.mockResolvedValue([BASE_TASK])
    mockUpdateTask.mockResolvedValue({ ...BASE_TASK, status: TaskStatus.IN_PROGRESS })
    renderTab()
    await waitFor(() => screen.getByText('Call client back'))
    const select = screen.getByRole('combobox', { name: i18n.t('tasks.form.status') })
    fireEvent.change(select, { target: { value: TaskStatus.IN_PROGRESS } })
    await waitFor(() =>
      expect(mockUpdateTask).toHaveBeenCalledWith('task-001', { status: TaskStatus.IN_PROGRESS })
    )
  })

  it('removes task after deletion', async () => {
    mockGetTasks.mockResolvedValue([BASE_TASK])
    mockDeleteTask.mockResolvedValue(undefined)
    renderTab()
    await waitFor(() => screen.getByText('Call client back'))
    fireEvent.click(screen.getByTitle(/eliminar|delete/i))
    const confirmBtn = screen.getAllByText(/eliminar|delete/i).find(
      (el) => el.tagName === 'BUTTON' && el.closest('.modal'),
    )
    if (confirmBtn) fireEvent.click(confirmBtn)
    await waitFor(() =>
      expect(screen.queryByText('Call client back')).not.toBeInTheDocument()
    )
  })

  it('fetches users on mount', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTab()
    await waitFor(() => expect(vi.mocked(usersApi.getUsers)).toHaveBeenCalled())
  })
})
