import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Avatar from './Avatar'

describe('Avatar', () => {
  it('renders image when src is provided', () => {
    render(<Avatar src="/photo.jpg" name="Ana García" />)
    expect(screen.getByRole('img')).toHaveAttribute('src', '/photo.jpg')
  })

  it('renders initials when no src', () => {
    render(<Avatar name="Ana García" />)
    expect(screen.getByText('AG')).toBeInTheDocument()
  })

  it('renders only first two words for initials', () => {
    render(<Avatar name="Pedro José Ruiz López" />)
    expect(screen.getByText('PJ')).toBeInTheDocument()
  })

  it('renders User icon when neither src nor name provided', () => {
    const { container } = render(<Avatar />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('applies custom size via style', () => {
    const { container } = render(<Avatar name="AB" size={60} />)
    const el = container.firstChild as HTMLElement
    expect(el.style.width).toBe('60px')
    expect(el.style.height).toBe('60px')
  })

  it('applies custom className', () => {
    const { container } = render(<Avatar name="AB" className="my-class" />)
    expect(container.firstChild).toHaveClass('avatar', 'my-class')
  })
})
