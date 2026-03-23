import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import InputField from './InputField'

describe('InputField', () => {
  it('renders label and input', () => {
    render(<InputField id="test" label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('binds label to input via id', () => {
    render(<InputField id="my-input" label="Name" />)
    const input = screen.getByLabelText('Name')
    expect(input).toHaveAttribute('id', 'my-input')
  })

  it('forwards props to the input element', () => {
    render(<InputField id="test" label="Name" type="email" placeholder="you@example.com" />)
    const input = screen.getByLabelText('Name')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('placeholder', 'you@example.com')
  })

  it('calls onChange when user types', async () => {
    const onChange = vi.fn()
    render(<InputField id="test" label="Name" onChange={onChange} />)
    await userEvent.type(screen.getByLabelText('Name'), 'hello')
    expect(onChange).toHaveBeenCalled()
  })

  it('applies extra className to the wrapper div', () => {
    const { container } = render(<InputField id="test" label="Name" className="col-span-2" />)
    expect(container.firstChild).toHaveClass('form-field', 'col-span-2')
  })
})
