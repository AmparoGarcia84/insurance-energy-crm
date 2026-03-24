import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AccountType } from '@crm/shared'
import BankAccountList from './BankAccountList'

describe('BankAccountList', () => {
  it('renders the add button when empty', () => {
    render(<BankAccountList value={[]} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /añadir cuenta/i })).toBeInTheDocument()
  })

  it('renders one card per account', () => {
    render(
      <BankAccountList
        value={[
          { type: AccountType.PERSONAL, iban: 'ES91 2100 0418 4502 0005 1332' },
          { type: AccountType.BUSINESS, iban: 'ES80 2310 0001 1800 0001 2345' },
        ]}
        onChange={vi.fn()}
      />
    )
    expect(screen.getAllByRole('combobox')).toHaveLength(2)
    expect(screen.getByDisplayValue('ES91 2100 0418 4502 0005 1332')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ES80 2310 0001 1800 0001 2345')).toBeInTheDocument()
  })

  it('calls onChange with a new empty entry when add is clicked', async () => {
    const onChange = vi.fn()
    render(<BankAccountList value={[]} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /añadir cuenta/i }))
    expect(onChange).toHaveBeenCalledWith([{ type: AccountType.PERSONAL, iban: '' }])
  })

  it('calls onChange without the removed entry when remove is clicked', async () => {
    const onChange = vi.fn()
    render(
      <BankAccountList
        value={[
          { type: AccountType.PERSONAL, iban: 'ES11111' },
          { type: AccountType.BUSINESS, iban: 'ES22222' },
        ]}
        onChange={onChange}
      />
    )
    const removeButtons = screen.getAllByRole('button', { name: /eliminar/i })
    await userEvent.click(removeButtons[0])
    expect(onChange).toHaveBeenCalledWith([{ type: AccountType.BUSINESS, iban: 'ES22222' }])
  })

  it('calls onChange with updated type when type select changes', async () => {
    const onChange = vi.fn()
    render(
      <BankAccountList
        value={[{ type: AccountType.PERSONAL, iban: 'ES11111' }]}
        onChange={onChange}
      />
    )
    await userEvent.selectOptions(screen.getByRole('combobox'), AccountType.BUSINESS)
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ type: AccountType.BUSINESS }),
    ])
  })

  it('calls onChange with updated IBAN when field changes', async () => {
    const onChange = vi.fn()
    render(
      <BankAccountList
        value={[{ type: AccountType.PERSONAL, iban: '' }]}
        onChange={onChange}
      />
    )
    await userEvent.type(screen.getByLabelText(/iban/i), 'E')
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ iban: 'E' }),
    ])
  })
})
