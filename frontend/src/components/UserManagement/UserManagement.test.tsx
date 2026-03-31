import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider } from '../../auth/AuthContext'
import { DataProvider } from '../../context/DataContext'
import UserManagement from './UserManagement'

const ownerUser = { id: '1', displayName: 'Mila', email: 'mila@example.com', role: 'OWNER' as const, avatarUrl: null }
const employeeUser = { id: '2', displayName: 'Ana', email: 'ana@example.com', role: 'EMPLOYEE' as const, avatarUrl: null }

vi.mock('../../api/auth', () => ({
  getMe: vi.fn().mockResolvedValue({ id: '1', displayName: 'Mila', email: 'mila@example.com', role: 'OWNER', avatarUrl: null }),
}))

vi.mock('../../api/users', () => ({
  getUsers: vi.fn().mockResolvedValue([]),
  createUser: vi.fn().mockResolvedValue({ id: '3', displayName: 'New User', email: 'new@example.com', role: 'EMPLOYEE', avatarUrl: null }),
  deleteUser: vi.fn().mockResolvedValue(undefined),
}))

import { getUsers, createUser, deleteUser } from '../../api/users'

function renderComponent() {
  return render(
    <AuthProvider>
      <DataProvider>
        <UserManagement />
      </DataProvider>
    </AuthProvider>
  )
}

describe('UserManagement', () => {
  beforeEach(() => {
    vi.mocked(getUsers).mockResolvedValue([])
  })

  it('renders the section heading', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Administración de usuarios')
    })
  })

  it('shows "Nuevo usuario" button', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /nuevo usuario/i })).toBeInTheDocument()
    })
  })

  it('shows empty state when there are no users', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('Sin usuarios')).toBeInTheDocument()
    })
  })

  it('opens the new user form when button is clicked', async () => {
    renderComponent()
    await waitFor(() => screen.getByRole('button', { name: /nuevo usuario/i }))
    await userEvent.click(screen.getByRole('button', { name: /nuevo usuario/i }))
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña provisional/i)).toBeInTheDocument()
  })

  it('calls createUser and adds the user to the list on submit', async () => {
    renderComponent()
    await waitFor(() => screen.getByRole('button', { name: /nuevo usuario/i }))
    await userEvent.click(screen.getByRole('button', { name: /nuevo usuario/i }))

    await userEvent.type(screen.getByLabelText(/nombre/i), 'New User')
    await userEvent.type(screen.getByLabelText(/email/i), 'new@example.com')
    await userEvent.type(screen.getByLabelText(/contraseña provisional/i), 'pass1234')
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => expect(createUser).toHaveBeenCalled())
    expect(screen.getByText('New User')).toBeInTheDocument()
  })

  it('cancels the form and resets it', async () => {
    renderComponent()
    await waitFor(() => screen.getByRole('button', { name: /nuevo usuario/i }))
    await userEvent.click(screen.getByRole('button', { name: /nuevo usuario/i }))
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(screen.queryByLabelText(/nombre/i)).not.toBeInTheDocument()
  })

  it('shows delete button for other users but not for the current user', async () => {
    vi.mocked(getUsers).mockResolvedValue([ownerUser, employeeUser])
    renderComponent()
    await waitFor(() => expect(screen.getByText('Mila')).toBeInTheDocument())

    // ownerUser is the current user (id '1') — no delete button for self
    // employeeUser is another user — delete button should appear
    expect(screen.getByText('Ana')).toBeInTheDocument()
    const deleteButtons = screen.getAllByRole('button', { name: /eliminar usuario/i })
    expect(deleteButtons).toHaveLength(1)
  })

  it('calls deleteUser after confirmation', async () => {
    vi.mocked(getUsers).mockResolvedValue([ownerUser, employeeUser])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderComponent()
    await waitFor(() => screen.getByText('Ana'))

    await userEvent.click(screen.getByRole('button', { name: /eliminar usuario/i }))
    expect(deleteUser).toHaveBeenCalledWith(employeeUser.id)
    await waitFor(() => expect(screen.queryByText('Ana')).not.toBeInTheDocument())
  })
})
