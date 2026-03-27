import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider } from '../../auth/AuthContext'
import Sidebar from './Sidebar'

const { mockGetMe } = vi.hoisted(() => ({
  mockGetMe: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../api/auth', () => ({
  getMe: mockGetMe,
  logout: vi.fn().mockResolvedValue(undefined),
}))

function renderSidebar(activeSection: Parameters<typeof Sidebar>[0]['activeSection'] = 'home') {
  return render(
    <AuthProvider>
      <Sidebar activeSection={activeSection} onNavigate={vi.fn()} />
    </AuthProvider>
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
    expect(screen.getByText('Jornada')).toBeInTheDocument()
  })

  it('renders logout button', () => {
    renderSidebar()
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument()
  })

  it('marks the active section with the active class', () => {
    renderSidebar('clients')
    expect(screen.getByText('Clientes').closest('li')).toHaveClass('active')
  })

  it('calls onNavigate when a nav item is clicked', async () => {
    const onNavigate = vi.fn()
    render(
      <AuthProvider>
        <Sidebar activeSection="home" onNavigate={onNavigate} />
      </AuthProvider>
    )
    await userEvent.click(screen.getByText('Clientes'))
    expect(onNavigate).toHaveBeenCalledWith('clients')
  })
})

describe('Sidebar — user management entry', () => {
  beforeEach(() => {
    mockGetMe.mockResolvedValue(null)
  })

  it('hides the user management entry for non-owner users', async () => {
    mockGetMe.mockResolvedValue({ id: '2', displayName: 'Ana', email: 'ana@example.com', role: 'EMPLOYEE', avatarUrl: null })
    render(<AuthProvider><Sidebar activeSection="home" onNavigate={vi.fn()} /></AuthProvider>)
    await waitFor(() => {
      expect(screen.queryByText('Administración de usuarios')).not.toBeInTheDocument()
    })
  })

  it('shows the user management entry for owner users', async () => {
    mockGetMe.mockResolvedValue({ id: '1', displayName: 'Mila', email: 'mila@example.com', role: 'OWNER', avatarUrl: null })
    render(<AuthProvider><Sidebar activeSection="home" onNavigate={vi.fn()} /></AuthProvider>)
    await waitFor(() => {
      expect(screen.getByText('Administración de usuarios')).toBeInTheDocument()
    })
  })

  it('navigates to userManagement when the entry is clicked', async () => {
    mockGetMe.mockResolvedValue({ id: '1', displayName: 'Mila', email: 'mila@example.com', role: 'OWNER', avatarUrl: null })
    const onNavigate = vi.fn()
    render(<AuthProvider><Sidebar activeSection="home" onNavigate={onNavigate} /></AuthProvider>)
    await waitFor(() => screen.getByText('Administración de usuarios'))
    await userEvent.click(screen.getByText('Administración de usuarios'))
    expect(onNavigate).toHaveBeenCalledWith('userManagement')
  })
})
