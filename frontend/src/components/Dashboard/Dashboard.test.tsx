import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AuthProvider } from '../../auth/AuthContext'
import Dashboard from './Dashboard'

vi.mock('../../api/auth', () => ({
  getMe: vi.fn().mockResolvedValue(null),
  logout: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../api/clients', () => ({
  getClients: vi.fn().mockResolvedValue([]),
}))

function renderDashboard() {
  return render(<AuthProvider><Dashboard /></AuthProvider>)
}

describe('Dashboard', () => {
  it('renders sidebar and topbar', () => {
    renderDashboard()
    expect(screen.getByRole('complementary')).toBeInTheDocument() // <aside>
    expect(screen.getByRole('banner')).toBeInTheDocument()        // <header>
  })

  it('renders main content area', () => {
    renderDashboard()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('shows home section by default', () => {
    renderDashboard()
    expect(screen.getByRole('main')).toHaveTextContent('Inicio')
  })
})
