import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AuthProvider } from '../../../auth/AuthContext'
import Login from './Login'
import * as authApi from '../../../api/auth'

vi.mock('../../../api/auth', () => ({
  getMe: vi.fn().mockResolvedValue(null),
  login: vi.fn().mockResolvedValue({ id: '1', email: 'test@test.com', role: 'OWNER', displayName: 'Mila' }),
}))

function renderLogin() {
  return render(<AuthProvider><Login /></AuthProvider>)
}

describe('Login', () => {
  it('renders email and password fields', () => {
    renderLogin()
    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('renders submit button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('calls login API with the entered credentials', async () => {
    renderLogin()
    await userEvent.type(screen.getByLabelText(/correo/i), 'test@test.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(vi.mocked(authApi.login)).toHaveBeenCalledWith('test@test.com', 'password123')
  })

  it('shows an error message when credentials are wrong', async () => {
    vi.mocked(authApi.login).mockRejectedValueOnce(new Error('Unauthorized'))
    renderLogin()
    await userEvent.type(screen.getByLabelText(/correo/i), 'bad@test.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    await waitFor(() =>
      expect(screen.getByText(/email o contraseña incorrectos/i)).toBeInTheDocument()
    )
  })
})
