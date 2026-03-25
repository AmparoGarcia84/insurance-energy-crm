import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import CheckboxField from './CheckboxField'

describe('CheckboxField', () => {
  it('renders a checkbox with a label', () => {
    render(<CheckboxField id="test" label="Es cliente principal" />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByLabelText('Es cliente principal')).toBeInTheDocument()
  })

  it('binds label to checkbox via id', () => {
    render(<CheckboxField id="my-check" label="Active" />)
    expect(screen.getByLabelText('Active')).toHaveAttribute('id', 'my-check')
  })

  it('reflects checked prop', () => {
    render(<CheckboxField id="test" label="Active" checked readOnly />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('reflects unchecked prop', () => {
    render(<CheckboxField id="test" label="Active" checked={false} readOnly />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('calls onChange when toggled', async () => {
    const onChange = vi.fn()
    render(<CheckboxField id="test" label="Active" onChange={onChange} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalled()
  })

  it('applies extra className to the wrapper div', () => {
    const { container } = render(<CheckboxField id="test" label="Active" className="col-span-2" />)
    expect(container.firstChild).toHaveClass('form-field--checkbox', 'col-span-2')
  })
})
