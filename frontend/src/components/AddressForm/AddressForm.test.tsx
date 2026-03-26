import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AddressForm from './AddressForm'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../utils/postalCode', () => ({
  lookupPostalCode: vi.fn(),
}))

const { lookupPostalCode } = await import('../../utils/postalCode')

describe('AddressForm', () => {
  beforeEach(() => {
    vi.mocked(lookupPostalCode).mockClear()
    vi.mocked(lookupPostalCode).mockResolvedValue(null)
  })

  it('renders all address fields', () => {
    render(<AddressForm value={{}} onChange={vi.fn()} />)
    expect(screen.getByLabelText(/address\.street/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/address\.postalCode/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/address\.city/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/address\.province/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/address\.country/i)).toBeInTheDocument()
  })

  it('populates fields from value prop', () => {
    render(
      <AddressForm
        value={{ street: 'Calle Mayor 1', postalCode: '28001', city: 'Madrid', province: 'Madrid', country: 'España' }}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/address\.street/i)).toHaveValue('Calle Mayor 1')
    expect(screen.getByLabelText(/address\.postalCode/i)).toHaveValue('28001')
    expect(screen.getByLabelText(/address\.city/i)).toHaveValue('Madrid')
    expect(screen.getByLabelText(/address\.province/i)).toHaveValue('Madrid')
    expect(screen.getByLabelText(/address\.country/i)).toHaveValue('España')
  })

  it('calls onChange preserving other fields when street changes', async () => {
    const onChange = vi.fn()
    render(<AddressForm value={{ city: 'Málaga' }} onChange={onChange} />)
    await userEvent.type(screen.getByLabelText(/address\.street/i), 'A')
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
    await userEvent.type(screen.getByLabelText(/address\.province/i), 'Madrid')
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toMatchObject({ street: 'Calle Mayor 1', postalCode: '28001', city: 'Madrid' })
  })

  it('sets field to undefined when cleared', async () => {
    const onChange = vi.fn()
    render(<AddressForm value={{ city: 'Sevilla' }} onChange={onChange} />)
    await userEvent.clear(screen.getByLabelText(/address\.city/i))
    expect(onChange).toHaveBeenLastCalledWith(expect.not.objectContaining({ city: expect.anything() }))
  })

  it('calls lookupPostalCode on postal code blur', async () => {
    render(<AddressForm value={{}} onChange={vi.fn()} />)
    fireEvent.blur(screen.getByLabelText(/address\.postalCode/i), { target: { value: '28001' } })
    await waitFor(() => expect(lookupPostalCode).toHaveBeenCalledWith('28001'))
  })

  it('fills city, province and country when lookup returns a result', async () => {
    vi.mocked(lookupPostalCode).mockResolvedValueOnce({ city: 'Madrid', province: 'Madrid', country: 'España' })
    const onChange = vi.fn()
    render(<AddressForm value={{ postalCode: '28001' }} onChange={onChange} />)
    fireEvent.blur(screen.getByLabelText(/address\.postalCode/i), { target: { value: '28001' } })
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        city: 'Madrid', province: 'Madrid', country: 'España',
      }))
    )
  })

  it('does not call onChange when lookup returns null', async () => {
    vi.mocked(lookupPostalCode).mockResolvedValueOnce(null)
    const onChange = vi.fn()
    render(<AddressForm value={{}} onChange={onChange} />)
    fireEvent.blur(screen.getByLabelText(/address\.postalCode/i), { target: { value: '99999' } })
    await waitFor(() => expect(lookupPostalCode).toHaveBeenCalled())
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not trigger lookup when postal code is empty', async () => {
    render(<AddressForm value={{}} onChange={vi.fn()} />)
    fireEvent.blur(screen.getByLabelText(/address\.postalCode/i), { target: { value: '' } })
    expect(lookupPostalCode).not.toHaveBeenCalled()
  })
})
