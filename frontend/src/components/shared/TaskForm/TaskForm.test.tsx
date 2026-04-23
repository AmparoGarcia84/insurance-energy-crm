import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../i18n'
import TaskForm from './TaskForm'
import { TaskStatus, TaskPriority, ReminderChannel, RelatedEntityType } from '../../../api/tasks'
import type { TaskWithRelations } from '../../../api/tasks'

const STUB_USERS = [
  { id: 'u-1', displayName: 'Mila', email: 'mila@crm.com', role: 'OWNER' as const, avatarUrl: null },
  { id: 'u-2', displayName: 'Asesora', email: 'asesor@crm.com', role: 'EMPLOYEE' as const, avatarUrl: null },
]

const STUB_TASK: TaskWithRelations = {
  id:                'task-001',
  subject:           'Send proposal',
  description:       'Send full proposal to client',
  status:            TaskStatus.IN_PROGRESS,
  priority:          TaskPriority.HIGH,
  relatedEntityType: RelatedEntityType.SALE,
  relatedEntityId:   's-1',
  clientId:          'c-1',
  dueDate:           '2026-05-01',
  assignedToUserId:  'u-1',
  hasReminder:       false,
  createdAt:         '2026-04-21T10:00:00.000Z',
  updatedAt:         '2026-04-21T10:00:00.000Z',
}

function renderForm(props?: Partial<React.ComponentProps<typeof TaskForm>>) {
  const defaults = {
    initial:   null,
    users:     STUB_USERS,
    onSubmit:  vi.fn(),
    onSave:    vi.fn(),
    onCancel:  vi.fn(),
  }
  return render(
    <I18nextProvider i18n={i18n}>
      <TaskForm {...defaults} {...props} />
    </I18nextProvider>
  )
}

beforeEach(() => vi.clearAllMocks())

describe('TaskForm', () => {
  it('renders "New task" title when initial is null', () => {
    renderForm()
    expect(screen.getByText(/nueva tarea|new task/i)).toBeInTheDocument()
  })

  it('renders "Edit task" title when editing an existing task', () => {
    renderForm({ initial: STUB_TASK })
    expect(screen.getByText(/editar tarea|edit task/i)).toBeInTheDocument()
  })

  it('pre-fills subject from initial task', () => {
    renderForm({ initial: STUB_TASK })
    const input = screen.getByLabelText<HTMLInputElement>(/asunto|subject/i)
    expect(input.value).toBe('Send proposal')
  })

  it('pre-fills description from initial task', () => {
    renderForm({ initial: STUB_TASK })
    const textarea = screen.getByLabelText<HTMLTextAreaElement>(/descripción|description/i)
    expect(textarea.value).toBe('Send full proposal to client')
  })

  it('shows all status options', () => {
    renderForm()
    const select = screen.getByLabelText<HTMLSelectElement>(/estado|status/i)
    expect(select).toBeInTheDocument()
    expect(select.options.length).toBe(Object.values(TaskStatus).length)
  })

  it('shows all priority options plus empty option', () => {
    renderForm()
    const select = screen.getByLabelText<HTMLSelectElement>(/prioridad|priority/i)
    expect(select.options.length).toBe(Object.values(TaskPriority).length + 1)
  })

  it('renders assigned-to selector with users', () => {
    renderForm()
    const select = screen.getByLabelText<HTMLSelectElement>(/asignada|assigned/i)
    expect(select).toBeInTheDocument()
    // 2 users + 1 empty option
    expect(select.options.length).toBe(3)
  })

  it('does not render assigned-to selector when no users', () => {
    renderForm({ users: [] })
    expect(screen.queryByLabelText(/asignada|assigned/i)).not.toBeInTheDocument()
  })

  it('reminder fields are hidden by default', () => {
    renderForm()
    expect(screen.queryByLabelText(/fecha del recordatorio|reminder date/i)).not.toBeInTheDocument()
  })

  it('shows reminder fields when checkbox is ticked', () => {
    renderForm()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByLabelText(/fecha del recordatorio|reminder date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/canal del recordatorio|reminder channel/i)).toBeInTheDocument()
  })

  it('hides reminder fields and clears them when checkbox is unticked', () => {
    renderForm()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByLabelText(/fecha del recordatorio|reminder date/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.queryByLabelText(/fecha del recordatorio|reminder date/i)).not.toBeInTheDocument()
  })

  it('calls onCancel when back button is clicked', () => {
    const onCancel = vi.fn()
    renderForm({ onCancel })
    fireEvent.click(screen.getByLabelText(/cancelar|cancel/i))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onCancel when Cancel button in form footer is clicked', () => {
    const onCancel = vi.fn()
    renderForm({ onCancel })
    // The footer cancel button has visible text "Cancelar"; use getAllByRole and pick the one without aria-label
    const cancelBtns = screen.getAllByRole('button', { name: /cancelar|cancel/i })
    const footerCancel = cancelBtns.find(
      (btn) => !btn.getAttribute('aria-label')
    )!
    fireEvent.click(footerCancel)
    expect(onCancel).toHaveBeenCalled()
  })

  it('save button is disabled when subject is empty', () => {
    renderForm()
    const saveBtn = screen.getByRole('button', { name: /guardar|save/i })
    expect(saveBtn).toBeDisabled()
  })

  it('save button is enabled when subject has a value', () => {
    renderForm()
    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'My task' } })
    expect(screen.getByRole('button', { name: /guardar|save/i })).not.toBeDisabled()
  })

  it('calls onSubmit with correct payload on submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ...STUB_TASK, id: 'new-1' })
    const onSave = vi.fn()
    renderForm({ onSubmit, onSave })

    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'My task' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar|save/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'My task', hasReminder: false })
      )
    })
  })

  it('calls onSave with the returned task after successful submit', async () => {
    const saved = { ...STUB_TASK, id: 'new-1', subject: 'My task' }
    const onSubmit = vi.fn().mockResolvedValue(saved)
    const onSave = vi.fn()
    renderForm({ onSubmit, onSave })

    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'My task' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar|save/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(saved)
    })
  })

  it('shows validation error when reminder is enabled but reminderAt is empty', async () => {
    const onSubmit = vi.fn()
    renderForm({ onSubmit })

    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'Task' } })
    fireEvent.click(screen.getByRole('checkbox')) // enable reminder
    // Don't fill reminderAt
    fireEvent.click(screen.getByRole('button', { name: /guardar|save/i }))

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled()
      expect(screen.getByText(/fecha del recordatorio es obligatoria|reminder date is required/i)).toBeInTheDocument()
    })
  })

  it('includes reminderChannel in payload when reminder is enabled', async () => {
    const onSubmit = vi.fn().mockResolvedValue(STUB_TASK)
    renderForm({ onSubmit })

    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'Task' } })
    fireEvent.click(screen.getByRole('checkbox'))

    // Fill reminderAt
    fireEvent.change(screen.getByLabelText(/fecha del recordatorio|reminder date/i), {
      target: { value: '2026-05-01T10:00' },
    })
    // Select channel
    fireEvent.change(screen.getByLabelText(/canal del recordatorio|reminder channel/i), {
      target: { value: ReminderChannel.EMAIL },
    })

    fireEvent.click(screen.getByRole('button', { name: /guardar|save/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          hasReminder:     true,
          reminderChannel: ReminderChannel.EMAIL,
        })
      )
    })
  })
})
