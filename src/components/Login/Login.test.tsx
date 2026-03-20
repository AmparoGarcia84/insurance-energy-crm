import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Login from './Login'

describe('Login', () => {
  it('renders email and password fields', () => {
    render(<Login onLogin={vi.fn()} />)
    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<Login onLogin={vi.fn()} />)
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('calls onLogin when form is submitted', async () => {
    const onLogin = vi.fn()
    render(<Login onLogin={onLogin} />)

    await userEvent.type(screen.getByLabelText(/correo/i), 'test@test.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(onLogin).toHaveBeenCalledOnce()
  })
})
