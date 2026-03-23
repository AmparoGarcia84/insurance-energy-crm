import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import AddressForm from './AddressForm'

describe('AddressForm', () => {
  it('renders all address fields', () => {
    render(<AddressForm value={{}} onChange={vi.fn()} />)
    expect(screen.getByLabelText(/calle/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/código postal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/municipio/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/provincia/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/país/i)).toBeInTheDocument()
  })

  it('populates fields from value prop', () => {
    render(
      <AddressForm
        value={{ street: 'Calle Mayor 1', postalCode: '28001', city: 'Madrid', province: 'Madrid', country: 'España' }}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/calle/i)).toHaveValue('Calle Mayor 1')
    expect(screen.getByLabelText(/código postal/i)).toHaveValue('28001')
    expect(screen.getByLabelText(/municipio/i)).toHaveValue('Madrid')
    expect(screen.getByLabelText(/provincia/i)).toHaveValue('Madrid')
    expect(screen.getByLabelText(/país/i)).toHaveValue('España')
  })

  it('calls onChange preserving other fields when street changes', async () => {
    const onChange = vi.fn()
    render(<AddressForm value={{ city: 'Málaga' }} onChange={onChange} />)
    await userEvent.type(screen.getByLabelText(/calle/i), 'A')
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ street: 'A', city: 'Málaga' })
    )
  })

  it('preserves existing fields when one field changes', async () => {
    const onChange = vi.fn()
    render(
      <AddressForm
        value={{ street: 'Calle Mayor 1', postalCode: '28001', city: 'Madrid' }}
        onChange={onChange}
      />
    )
    await userEvent.type(screen.getByLabelText(/provincia/i), 'Madrid')
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toMatchObject({ street: 'Calle Mayor 1', postalCode: '28001', city: 'Madrid' })
  })

  it('sets field to undefined when cleared', async () => {
    const onChange = vi.fn()
    render(<AddressForm value={{ city: 'Sevilla' }} onChange={onChange} />)
    await userEvent.clear(screen.getByLabelText(/municipio/i))
    expect(onChange).toHaveBeenLastCalledWith(expect.not.objectContaining({ city: expect.anything() }))
  })
})
