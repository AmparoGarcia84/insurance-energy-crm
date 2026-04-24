import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../i18n'
import TaskForm from './TaskForm'
import type { TaskFormContext } from './TaskForm'
import { TaskStatus, TaskPriority, ReminderChannel } from '../../../api/tasks'
import type { TaskWithRelations } from '../../../api/tasks'

// ── API mocks ──────────────────────────────────────────────────────────────────

vi.mock('../../../api/clients', () => ({
  getClients: vi.fn().mockResolvedValue([
    { id: 'c-1', name: 'Acme Corp' },
    { id: 'c-2', name: 'Global Ltd' },
  ]),
}))

vi.mock('../../../api/sales', () => ({
  getSales: vi.fn().mockResolvedValue([
    { id: 's-1', title: 'Sale A', clientId: 'c-1' },
    { id: 's-2', title: 'Sale B', clientId: 'c-1' },
  ]),
}))

vi.mock('../../../api/cases', () => ({
  getCases: vi.fn().mockResolvedValue([
    { id: 'case-1', title: 'Case Alpha', saleId: 's-1', clientId: 'c-1' },
  ]),
}))

// ── Fixtures ───────────────────────────────────────────────────────────────────

const STUB_USERS = [
  { id: 'u-1', displayName: 'Mila',    email: 'mila@crm.com',   role: 'OWNER'    as const, avatarUrl: null },
  { id: 'u-2', displayName: 'Asesora', email: 'asesor@crm.com', role: 'EMPLOYEE' as const, avatarUrl: null },
]

/** Context that locks client — used in most tests to keep them focused on other fields. */
const LOCKED_CLIENT: TaskFormContext = {
  lockedClientId:   'c-1',
  lockedClientName: 'Acme Corp',
}

const LOCKED_SALE: TaskFormContext = {
  lockedClientId:   'c-1',
  lockedClientName: 'Acme Corp',
  lockedSaleId:     's-1',
  lockedSaleName:   'Sale A',
}

const STUB_TASK: TaskWithRelations = {
  id:               'task-001',
  subject:          'Send proposal',
  description:      'Send full proposal to client',
  status:           TaskStatus.IN_PROGRESS,
  priority:         TaskPriority.HIGH,
  clientId:         'c-1',
  saleId:           's-1',
  hasReminder:      false,
  createdAt:        '2026-04-21T10:00:00.000Z',
  updatedAt:        '2026-04-21T10:00:00.000Z',
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function renderForm(props?: Partial<React.ComponentProps<typeof TaskForm>>) {
  const defaults = {
    initial:   null,
    users:     STUB_USERS,
    context:   LOCKED_CLIENT,
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

// ── Title ──────────────────────────────────────────────────────────────────────

describe('TaskForm', () => {
  it('renders "New task" title when initial is null', () => {
    renderForm()
    expect(screen.getByText(/nueva tarea|new task/i)).toBeInTheDocument()
  })

  it('renders "Edit task" title when editing an existing task', () => {
    renderForm({ initial: STUB_TASK })
    expect(screen.getByText(/editar tarea|edit task/i)).toBeInTheDocument()
  })

  // ── Pre-fill ─────────────────────────────────────────────────────────────────

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

  // ── Status / Priority ─────────────────────────────────────────────────────────

  it('shows all status options', () => {
    renderForm()
    const select = screen.getByLabelText<HTMLSelectElement>(/estado|status/i)
    expect(select.options.length).toBe(Object.values(TaskStatus).length)
  })

  it('shows all priority options plus empty option', () => {
    renderForm()
    const select = screen.getByLabelText<HTMLSelectElement>(/prioridad|priority/i)
    expect(select.options.length).toBe(Object.values(TaskPriority).length + 1)
  })

  // ── Assigned to ───────────────────────────────────────────────────────────────

  it('renders assigned-to selector with users', () => {
    renderForm()
    const select = screen.getByLabelText<HTMLSelectElement>(/asignada|assigned/i)
    expect(select.options.length).toBe(3) // 2 users + 1 empty
  })

  it('does not render assigned-to selector when no users', () => {
    renderForm({ users: [] })
    expect(screen.queryByLabelText(/asignada|assigned/i)).not.toBeInTheDocument()
  })

  // ── Context: locked client ────────────────────────────────────────────────────

  it('shows locked client name when context.lockedClientId is provided', () => {
    renderForm({ context: LOCKED_CLIENT })
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    // No client dropdown
    expect(screen.queryByLabelText(/^cliente|^client/i)).not.toBeInTheDocument()
  })

  it('shows locked sale name when context.lockedSaleId is provided', () => {
    renderForm({ context: LOCKED_SALE })
    expect(screen.getByText('Sale A')).toBeInTheDocument()
    // No sale dropdown
    expect(screen.queryByLabelText(/^venta|^sale/i)).not.toBeInTheDocument()
  })

  // ── Association section in standalone mode ────────────────────────────────────

  it('shows client dropdown in standalone mode (no context)', async () => {
    renderForm({ context: undefined })
    await waitFor(() => {
      expect(screen.getByLabelText(/^cliente|^client/i)).toBeInTheDocument()
    })
  })

  // ── Provider section ──────────────────────────────────────────────────────────

  it('renders provider name and phone fields', () => {
    renderForm()
    expect(screen.getByLabelText(/nombre del proveedor|provider name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/teléfono del proveedor|provider phone/i)).toBeInTheDocument()
  })

  it('pre-fills provider fields from initial task', () => {
    const taskWithProvider = { ...STUB_TASK, providerName: 'ACME Insurance', providerPhone: '600123456' }
    renderForm({ initial: taskWithProvider })
    const nameInput  = screen.getByLabelText<HTMLInputElement>(/nombre del proveedor|provider name/i)
    const phoneInput = screen.getByLabelText<HTMLInputElement>(/teléfono del proveedor|provider phone/i)
    expect(nameInput.value).toBe('ACME Insurance')
    expect(phoneInput.value).toBe('600123456')
  })

  it('includes providerName and providerPhone in payload on submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ...STUB_TASK, id: 'new-1' })
    renderForm({ onSubmit, context: LOCKED_CLIENT })

    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'My task' } })
    fireEvent.change(screen.getByLabelText(/nombre del proveedor|provider name/i), { target: { value: 'ACME' } })
    fireEvent.change(screen.getByLabelText(/teléfono del proveedor|provider phone/i), { target: { value: '600000000' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar|save/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ providerName: 'ACME', providerPhone: '600000000' })
      )
    })
  })

  // ── Reminder ──────────────────────────────────────────────────────────────────

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

  it('hides reminder fields when checkbox is unticked', () => {
    renderForm()
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.queryByLabelText(/fecha del recordatorio|reminder date/i)).not.toBeInTheDocument()
  })

  // ── Actions ───────────────────────────────────────────────────────────────────

  it('calls onCancel when back button is clicked', () => {
    const onCancel = vi.fn()
    renderForm({ onCancel })
    fireEvent.click(screen.getByLabelText(/cancelar|cancel/i))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onCancel when Cancel button in form footer is clicked', () => {
    const onCancel = vi.fn()
    renderForm({ onCancel })
    const cancelBtns = screen.getAllByRole('button', { name: /cancelar|cancel/i })
    const footerCancel = cancelBtns.find((btn) => !btn.getAttribute('aria-label'))!
    fireEvent.click(footerCancel)
    expect(onCancel).toHaveBeenCalled()
  })

  it('save button is disabled when subject is empty', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /guardar|save/i })).toBeDisabled()
  })

  it('save button is enabled when subject has a value and client is locked', () => {
    renderForm({ context: LOCKED_CLIENT })
    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'My task' } })
    expect(screen.getByRole('button', { name: /guardar|save/i })).not.toBeDisabled()
  })

  // ── Submit ────────────────────────────────────────────────────────────────────

  it('calls onSubmit with correct payload on submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ...STUB_TASK, id: 'new-1' })
    renderForm({ onSubmit, context: LOCKED_CLIENT })

    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'My task' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar|save/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'My task', hasReminder: false, clientId: 'c-1' })
      )
    })
  })

  it('calls onSave with the returned task after successful submit', async () => {
    const saved = { ...STUB_TASK, id: 'new-1', subject: 'My task' }
    const onSubmit = vi.fn().mockResolvedValue(saved)
    const onSave = vi.fn()
    renderForm({ onSubmit, onSave, context: LOCKED_CLIENT })

    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'My task' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar|save/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(saved)
    })
  })

  it('shows validation error when reminder enabled but reminderAt is empty', async () => {
    const onSubmit = vi.fn()
    renderForm({ onSubmit, context: LOCKED_CLIENT })

    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'Task' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /guardar|save/i }))

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled()
      expect(screen.getByText(/fecha del recordatorio es obligatoria|reminder date is required/i)).toBeInTheDocument()
    })
  })

  it('includes reminderChannel in payload when reminder is enabled', async () => {
    const onSubmit = vi.fn().mockResolvedValue(STUB_TASK)
    renderForm({ onSubmit, context: LOCKED_CLIENT })

    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'Task' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.change(screen.getByLabelText(/fecha del recordatorio|reminder date/i), {
      target: { value: '2026-05-01T10:00' },
    })
    fireEvent.change(screen.getByLabelText(/canal del recordatorio|reminder channel/i), {
      target: { value: ReminderChannel.EMAIL },
    })
    fireEvent.click(screen.getByRole('button', { name: /guardar|save/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ hasReminder: true, reminderChannel: ReminderChannel.EMAIL })
      )
    })
  })

  // ── Client required validation ─────────────────────────────────────────────────

  it('shows error and does not submit when no client is selected in standalone mode', async () => {
    const onSubmit = vi.fn()
    renderForm({ onSubmit, context: undefined })

    await waitFor(() =>
      expect(screen.getByLabelText(/^cliente|^client/i)).toBeInTheDocument()
    )

    fireEvent.change(screen.getByLabelText(/asunto|subject/i), { target: { value: 'Task' } })
    // Save is disabled because no clientId
    const saveBtn = screen.getByRole('button', { name: /guardar|save/i })
    expect(saveBtn).toBeDisabled()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
