import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../i18n'
import Tasks from './Tasks'
import * as tasksApi from '../../../api/tasks'
import { TaskStatus, TaskPriority } from '../../../api/tasks'

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

// @dnd-kit requires pointer events — provide a minimal stub
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>()
  return {
    ...actual,
    DndContext:   ({ children }: { children: React.ReactNode }) => <>{children}</>,
    DragOverlay:  () => null,
    useDraggable: () => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null, isDragging: false }),
    useDroppable: () => ({ setNodeRef: () => {}, isOver: false }),
    useSensors:   () => [],
    useSensor:    () => null,
  }
})

const mockGetTasks   = vi.mocked(tasksApi.getTasks)
const mockUpdateTask = vi.mocked(tasksApi.updateTask)
const mockDeleteTask = vi.mocked(tasksApi.deleteTask)

const STUB_TASK = {
  id:          'task-001',
  clientId:    'c-1',
  subject:     'Review policy',
  description: undefined,
  status:      TaskStatus.NOT_STARTED,
  priority:    TaskPriority.NORMAL,
  dueDate:     null,
  hasReminder: false,
  assignedTo:  null,
  client:      { id: 'c-1', name: 'Acme Corp', clientNumber: '001' },
  createdAt:   '2026-04-21T10:00:00.000Z',
  updatedAt:   '2026-04-21T10:00:00.000Z',
}

function renderTasks() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Tasks />
    </I18nextProvider>
  )
}

beforeEach(() => vi.clearAllMocks())

describe('Tasks (global kanban)', () => {
  it('renders the page title', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTasks()
    await waitFor(() => {
      expect(screen.getByText(/tareas|tasks/i)).toBeInTheDocument()
    })
  })

  it('fetches all tasks without filters', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTasks()
    await waitFor(() => {
      expect(mockGetTasks).toHaveBeenCalledWith()
    })
  })

  it('renders task subject in its column', async () => {
    mockGetTasks.mockResolvedValue([STUB_TASK])
    renderTasks()
    await waitFor(() => {
      expect(screen.getByText('Review policy')).toBeInTheDocument()
    })
  })

  it('shows client name on the card', async () => {
    mockGetTasks.mockResolvedValue([STUB_TASK])
    renderTasks()
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })
  })

  it('filters tasks by search term', async () => {
    mockGetTasks.mockResolvedValue([
      STUB_TASK,
      { ...STUB_TASK, id: 'task-002', subject: 'Send invoice', client: { id: 'c-2', name: 'Beta Ltd', clientNumber: '002' } },
    ])
    renderTasks()
    await waitFor(() => screen.getByText('Review policy'))

    fireEvent.change(screen.getByPlaceholderText(/buscar|search/i), { target: { value: 'invoice' } })

    expect(screen.queryByText('Review policy')).not.toBeInTheDocument()
    expect(screen.getByText('Send invoice')).toBeInTheDocument()
  })

  it('shows "New task" button', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTasks()
    await waitFor(() => {
      expect(screen.getByText(/nueva tarea|new task/i)).toBeInTheDocument()
    })
  })

  it('opens form when "New task" is clicked', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTasks()
    await waitFor(() => screen.getByText(/nueva tarea|new task/i))

    fireEvent.click(screen.getByText(/nueva tarea|new task/i))
    expect(screen.getByLabelText(/asunto|subject/i)).toBeInTheDocument()
  })

  it('shows column headers for all statuses', async () => {
    mockGetTasks.mockResolvedValue([])
    renderTasks()
    await waitFor(() => {
      expect(screen.getByText(/sin iniciar|not started/i)).toBeInTheDocument()
      expect(screen.getByText(/en progreso|in progress/i)).toBeInTheDocument()
      expect(screen.getByText(/completada|completed/i)).toBeInTheDocument()
    })
  })

  it('calls updateTask when a task is toggled complete', async () => {
    mockGetTasks.mockResolvedValue([STUB_TASK])
    mockUpdateTask.mockResolvedValue({ ...STUB_TASK, status: TaskStatus.COMPLETED })
    renderTasks()
    await waitFor(() => screen.getByText('Review policy'))

    fireEvent.click(screen.getByTitle(/completar|complete/i))
    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith('task-001', { status: TaskStatus.COMPLETED })
    })
  })

  it('removes task after deletion confirmed', async () => {
    mockGetTasks.mockResolvedValue([STUB_TASK])
    mockDeleteTask.mockResolvedValue(undefined)
    renderTasks()
    await waitFor(() => screen.getByText('Review policy'))

    fireEvent.click(screen.getByTitle(/eliminar|delete/i))
    const confirmBtn = screen.getAllByText(/eliminar|delete/i).find(
      (el) => el.tagName === 'BUTTON' && el.closest('.modal')
    )
    if (confirmBtn) fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.queryByText('Review policy')).not.toBeInTheDocument()
    })
  })
})
