import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ConfirmModal from './ConfirmModal'

const defaultProps = {
  title: 'Confirm action',
  message: 'Are you sure?',
  onClose: vi.fn(),
  actions: [
    { label: 'Cancel', onClick: vi.fn(), variant: 'secondary' as const },
    { label: 'Confirm', onClick: vi.fn(), variant: 'primary' as const },
  ],
}

describe('ConfirmModal', () => {
  it('renders title and message', () => {
    render(<ConfirmModal {...defaultProps} />)
    expect(screen.getByText('Confirm action')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('renders all action buttons', () => {
    render(<ConfirmModal {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })

  it('calls action onClick when button is clicked', async () => {
    const onConfirm = vi.fn()
    const props = { ...defaultProps, actions: [{ label: 'Confirm', onClick: onConfirm, variant: 'primary' as const }] }
    render(<ConfirmModal {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn()
    render(<ConfirmModal {...defaultProps} onClose={onClose} />)
    await userEvent.click(document.querySelector('.modal-backdrop')!)
    expect(onClose).toHaveBeenCalled()
  })

  it('does not call onClose when modal content is clicked', async () => {
    const onClose = vi.fn()
    render(<ConfirmModal {...defaultProps} onClose={onClose} />)
    await userEvent.click(document.querySelector('.modal')!)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('has dialog role', () => {
    render(<ConfirmModal {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
