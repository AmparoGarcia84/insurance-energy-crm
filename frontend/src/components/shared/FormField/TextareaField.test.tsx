import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import TextareaField from './TextareaField'

describe('TextareaField', () => {
  it('renders label and textarea', () => {
    render(<TextareaField id="test" label="Notes" />)
    expect(screen.getByLabelText('Notes')).toBeInTheDocument()
  })

  it('binds label to textarea via id', () => {
    render(<TextareaField id="my-textarea" label="Description" />)
    const textarea = screen.getByLabelText('Description')
    expect(textarea).toHaveAttribute('id', 'my-textarea')
    expect(textarea.tagName).toBe('TEXTAREA')
  })

  it('forwards props to the textarea element', () => {
    render(<TextareaField id="test" label="Notes" rows={5} placeholder="Write here..." />)
    const textarea = screen.getByLabelText('Notes')
    expect(textarea).toHaveAttribute('rows', '5')
    expect(textarea).toHaveAttribute('placeholder', 'Write here...')
  })

  it('calls onChange when user types', async () => {
    const onChange = vi.fn()
    render(<TextareaField id="test" label="Notes" onChange={onChange} />)
    await userEvent.type(screen.getByLabelText('Notes'), 'hello')
    expect(onChange).toHaveBeenCalled()
  })

  it('applies extra className to the wrapper div', () => {
    const { container } = render(<TextareaField id="test" label="Notes" className="full-width" />)
    expect(container.firstChild).toHaveClass('form-field', 'full-width')
  })
})
