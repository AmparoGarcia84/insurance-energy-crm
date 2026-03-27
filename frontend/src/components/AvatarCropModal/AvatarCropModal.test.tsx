import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AvatarCropModal from './AvatarCropModal'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// react-easy-crop uses canvas and ResizeObserver which are not available in jsdom
vi.mock('react-easy-crop', () => ({
  default: () => <div data-testid="cropper" />,
}))

const noop = vi.fn()

describe('AvatarCropModal', () => {
  it('renders the title and action buttons', () => {
    render(<AvatarCropModal imageSrc="blob:test" onSave={noop} onClose={noop} />)
    expect(screen.getByText('topbar.cropTitle')).toBeInTheDocument()
    expect(screen.getByText('common.cancel')).toBeInTheDocument()
    expect(screen.getByText('common.save')).toBeInTheDocument()
  })

  it('renders the cropper', () => {
    render(<AvatarCropModal imageSrc="blob:test" onSave={noop} onClose={noop} />)
    expect(screen.getByTestId('cropper')).toBeInTheDocument()
  })

  it('renders the zoom slider', () => {
    render(<AvatarCropModal imageSrc="blob:test" onSave={noop} onClose={noop} />)
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<AvatarCropModal imageSrc="blob:test" onSave={noop} onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog', { hidden: true }).parentElement!)
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(<AvatarCropModal imageSrc="blob:test" onSave={noop} onClose={onClose} />)
    fireEvent.click(screen.getByText('common.cancel'))
    expect(onClose).toHaveBeenCalled()
  })
})
