import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TopBar from './TopBar'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { displayName: 'Mila García', role: 'OWNER' } }),
}))

describe('TopBar', () => {
  it('renders search input', () => {
    render(<TopBar />)
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('renders mail and notifications buttons', () => {
    render(<TopBar />)
    expect(screen.getByRole('button', { name: 'topbar.mail' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'topbar.notifications' })).toBeInTheDocument()
  })

  it('renders the logged-in user display name', () => {
    render(<TopBar />)
    expect(screen.getByText('Mila García')).toBeInTheDocument()
  })
})
