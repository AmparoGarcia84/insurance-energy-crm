import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import SelectField from './SelectField'

describe('SelectField', () => {
  it('renders label and select', () => {
    render(
      <SelectField id="test" label="Status">
        <option value="A">Option A</option>
      </SelectField>
    )
    expect(screen.getByLabelText('Status')).toBeInTheDocument()
  })

  it('binds label to select via id', () => {
    render(
      <SelectField id="my-select" label="Type">
        <option value="X">X</option>
      </SelectField>
    )
    expect(screen.getByLabelText('Type')).toHaveAttribute('id', 'my-select')
  })

  it('renders all option children', () => {
    render(
      <SelectField id="test" label="Type">
        <option value="A">Apple</option>
        <option value="B">Banana</option>
        <option value="C">Cherry</option>
      </SelectField>
    )
    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Cherry' })).toBeInTheDocument()
  })

  it('calls onChange when user selects an option', async () => {
    const onChange = vi.fn()
    render(
      <SelectField id="test" label="Type" onChange={onChange}>
        <option value="A">A</option>
        <option value="B">B</option>
      </SelectField>
    )
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'B')
    expect(onChange).toHaveBeenCalled()
  })

  it('applies extra className to the wrapper div', () => {
    const { container } = render(
      <SelectField id="test" label="Type" className="col-span-2">
        <option value="A">A</option>
      </SelectField>
    )
    expect(container.firstChild).toHaveClass('form-field', 'col-span-2')
  })
})
