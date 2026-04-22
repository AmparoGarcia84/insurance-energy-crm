import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AuthProvider } from '../../../auth/AuthContext'
import MyAccount from './MyAccount'

vi.mock('../../../api/auth', () => ({
  getMe: vi.fn().mockResolvedValue({ id: '1', displayName: 'Mila', email: 'mila@example.com', role: 'OWNER', avatarUrl: null }),
  uploadAvatar: vi.fn().mockResolvedValue({ id: '1', displayName: 'Mila', email: 'mila@example.com', role: 'OWNER', avatarUrl: '/uploads/avatars/1.jpg' }),
  changeEmail: vi.fn().mockResolvedValue({ id: '1', displayName: 'Mila', email: 'new@example.com', role: 'OWNER', avatarUrl: null }),
  changePassword: vi.fn().mockResolvedValue(undefined),
}))

import { changeEmail, changePassword } from '../../../api/auth'

function renderComponent() {
  return render(<AuthProvider><MyAccount /></AuthProvider>)
}

describe('MyAccount', () => {
  it('renders the page title', async () => {
    renderComponent()
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mi cuenta'))
  })

  it('renders the three sections', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Foto de perfil' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: 'Correo electrónico' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: 'Cambiar contraseña' })).toBeInTheDocument()
    })
  })

  it('calls changeEmail on email form submit', async () => {
    renderComponent()
    await waitFor(() => screen.getByLabelText('Correo electrónico'))
    await userEvent.clear(screen.getByLabelText('Correo electrónico'))
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'new@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar correo' }))
    await waitFor(() => expect(changeEmail).toHaveBeenCalledWith('new@example.com'))
    expect(screen.getByText('Correo actualizado correctamente')).toBeInTheDocument()
  })

  it('shows error when new passwords do not match', async () => {
    renderComponent()
    await waitFor(() => screen.getByLabelText('Contraseña actual'))
    await userEvent.type(screen.getByLabelText('Contraseña actual'), 'oldpass1')
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'newpass1')
    await userEvent.type(screen.getByLabelText('Confirmar nueva contraseña'), 'different')
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()
    expect(changePassword).not.toHaveBeenCalled()
  })

  it('calls changePassword on valid password form submit', async () => {
    renderComponent()
    await waitFor(() => screen.getByLabelText('Contraseña actual'))
    await userEvent.type(screen.getByLabelText('Contraseña actual'), 'oldpass1')
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'newpass12')
    await userEvent.type(screen.getByLabelText('Confirmar nueva contraseña'), 'newpass12')
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    await waitFor(() => expect(changePassword).toHaveBeenCalledWith('oldpass1', 'newpass12'))
    expect(screen.getByText('Contraseña cambiada correctamente')).toBeInTheDocument()
  })
})
