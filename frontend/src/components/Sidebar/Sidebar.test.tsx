import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AuthProvider } from '../../auth/AuthContext'
import Sidebar from './Sidebar'

vi.mock('../../api/auth', () => ({
  getMe: vi.fn().mockResolvedValue(null),
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
