import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AddressType } from '@crm/shared'
import AddressList from './AddressList'

describe('AddressList', () => {
  it('renders the add button when empty', () => {
    render(<AddressList value={[]} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /añadir dirección/i })).toBeInTheDocument()
  })

  it('renders one card per address', () => {
    render(
      <AddressList
        value={[
          { type: AddressType.FISCAL, street: 'Calle Mayor 1' },
          { type: AddressType.PERSONAL, street: 'Gran Vía 2' },
        ]}
        onChange={vi.fn()}
      />
    )
    expect(screen.getAllByRole('combobox')).toHaveLength(2)
    expect(screen.getByDisplayValue('Calle Mayor 1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Gran Vía 2')).toBeInTheDocument()
  })

  it('calls onChange with a new empty entry when add is clicked', async () => {
    const onChange = vi.fn()
    render(<AddressList value={[]} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /añadir dirección/i }))
    expect(onChange).toHaveBeenCalledWith([{ type: AddressType.FISCAL }])
  })

  it('appends to existing entries when add is clicked', async () => {
    const onChange = vi.fn()
    const existing = [{ type: AddressType.FISCAL, street: 'Calle A' }]
    render(<AddressList value={existing} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /añadir dirección/i }))
    expect(onChange).toHaveBeenCalledWith([...existing, { type: AddressType.FISCAL }])
  })

  it('calls onChange without the removed entry when remove is clicked', async () => {
    const onChange = vi.fn()
    render(
      <AddressList
        value={[
          { type: AddressType.FISCAL, street: 'Calle A' },
          { type: AddressType.PERSONAL, street: 'Calle B' },
        ]}
        onChange={onChange}
      />
    )
    const removeButtons = screen.getAllByRole('button', { name: /eliminar/i })
    await userEvent.click(removeButtons[0])
    expect(onChange).toHaveBeenCalledWith([{ type: AddressType.PERSONAL, street: 'Calle B' }])
  })

  it('calls onChange with updated type when type select changes', async () => {
    const onChange = vi.fn()
    render(
      <AddressList
        value={[{ type: AddressType.FISCAL }]}
        onChange={onChange}
      />
    )
    await userEvent.selectOptions(screen.getByRole('combobox'), AddressType.PERSONAL)
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ type: AddressType.PERSONAL })])
  })
})
