import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TopBar from './TopBar'

describe('TopBar', () => {
  it('renders search input', () => {
    render(<TopBar />)
    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument()
  })

  it('renders mail and notifications buttons', () => {
    render(<TopBar />)
    expect(screen.getByRole('button', { name: /correo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /notificaciones/i })).toBeInTheDocument()
  })

  it('renders user name', () => {
    render(<TopBar />)
    expect(screen.getByText('Mila García')).toBeInTheDocument()
  })
})
