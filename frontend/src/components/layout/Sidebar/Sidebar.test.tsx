import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../auth/AuthContext'
import Sidebar from './Sidebar'

const { mockGetMe } = vi.hoisted(() => ({
  mockGetMe: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../../api/auth', () => ({
  getMe: mockGetMe,
  logout: vi.fn().mockResolvedValue(undefined),
}))

function renderSidebar(initialPath = '/home') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Sidebar />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Sidebar', () => {
  it('renders all nav items', () => {
    renderSidebar()
    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('Ventas')).toBeInTheDocument()
    expect(screen.getByText('Pólizas')).toBeInTheDocument()
    expect(screen.getByText('Energía')).toBeInTheDocument()
    expect(screen.getByText('Casos')).toBeInTheDocument()
    expect(screen.getByText('Colaboradores')).toBeInTheDocument()
    expect(screen.queryByText('Jornada')).not.toBeInTheDocument()
  })

  it('renders logout button', () => {
    renderSidebar()
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument()
  })

  it('marks the active section with the active class based on current path', () => {
    renderSidebar('/clients')
    expect(screen.getByText('Clientes').closest('li')).toHaveClass('active')
  })

  it('marks home as active when path is /home', () => {
    renderSidebar('/home')
    expect(screen.getByText('Inicio').closest('li')).toHaveClass('active')
  })
})

describe('Sidebar — user management entry', () => {
  beforeEach(() => {
    mockGetMe.mockResolvedValue(null)
  })

  it('hides the user management entry for non-owner users', async () => {
    mockGetMe.mockResolvedValue({ id: '2', displayName: 'Ana', email: 'ana@example.com', role: 'EMPLOYEE', avatarUrl: null })
    renderSidebar()
    await waitFor(() => {
      expect(screen.queryByText('Administración de usuarios')).not.toBeInTheDocument()
    })
  })

  it('shows the user management entry for owner users', async () => {
    mockGetMe.mockResolvedValue({ id: '1', displayName: 'Mila', email: 'mila@example.com', role: 'OWNER', avatarUrl: null })
    renderSidebar()
    await waitFor(() => {
      expect(screen.getByText('Administración de usuarios')).toBeInTheDocument()
    })
  })

  it('navigates to /settings/users when the entry is clicked', async () => {
    mockGetMe.mockResolvedValue({ id: '1', displayName: 'Mila', email: 'mila@example.com', role: 'OWNER', avatarUrl: null })
    renderSidebar()
    await waitFor(() => screen.getByText('Administración de usuarios'))
    // NavLink renders as <a> — clicking it changes the MemoryRouter location
    await userEvent.click(screen.getByText('Administración de usuarios'))
    // The li should become active since path now matches /settings/users
    expect(screen.getByText('Administración de usuarios').closest('li')).toHaveClass('active')
  })
})
