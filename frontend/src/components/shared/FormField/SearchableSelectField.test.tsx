import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchableSelectField from './SearchableSelectField'

const OPTIONS = [
  { value: 'LAW_FIRM', label: 'Abogados' },
  { value: 'BAKERY', label: 'Panadería y pastelería' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'PHARMACY', label: 'Farmacia' },
]

describe('SearchableSelectField', () => {
  it('renders label and control button', () => {
    render(
      <SearchableSelectField
        id="test"
        label="Actividad"
        name="activity"
        value=""
        options={OPTIONS}
        emptyLabel="— Sin asignar —"
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByText('Actividad')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('shows emptyLabel when no value is selected', () => {
    render(
      <SearchableSelectField
        id="test"
        label="Actividad"
        name="activity"
        value=""
        options={OPTIONS}
        emptyLabel="— Sin asignar —"
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByText('— Sin asignar —')).toBeInTheDocument()
  })

  it('shows selected option label', () => {
    render(
      <SearchableSelectField
        id="test"
        label="Actividad"
        name="activity"
        value="HOTEL"
        options={OPTIONS}
        emptyLabel="— Sin asignar —"
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('button')).toHaveTextContent('Hotel')
  })

  it('opens dropdown on button click', () => {
    render(
      <SearchableSelectField
        id="test"
        label="Actividad"
        name="activity"
        value=""
        options={OPTIONS}
        emptyLabel="— Sin asignar —"
        onChange={vi.fn()}
      />,
    )
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('lists all options when dropdown is open', () => {
    render(
      <SearchableSelectField
        id="test"
        label="Actividad"
        name="activity"
        value=""
        options={OPTIONS}
        emptyLabel="— Sin asignar —"
        onChange={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Abogados')).toBeInTheDocument()
    expect(screen.getByText('Panadería y pastelería')).toBeInTheDocument()
    expect(screen.getByText('Hotel')).toBeInTheDocument()
  })

  it('filters options by search text', () => {
    render(
      <SearchableSelectField
        id="test"
        label="Actividad"
        name="activity"
        value=""
        options={OPTIONS}
        emptyLabel="— Sin asignar —"
        onChange={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'far' } })
    expect(screen.getByText('Farmacia')).toBeInTheDocument()
    expect(screen.queryByText('Abogados')).not.toBeInTheDocument()
    expect(screen.queryByText('Hotel')).not.toBeInTheDocument()
  })

  it('shows noResultsLabel when search has no matches', () => {
    render(
      <SearchableSelectField
        id="test"
        label="Actividad"
        name="activity"
        value=""
        options={OPTIONS}
        emptyLabel="— Sin asignar —"
        noResultsLabel="Sin resultados"
        onChange={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'xyz' } })
    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
  })

  it('calls onChange and closes dropdown when option is selected', () => {
    const onChange = vi.fn()
    render(
      <SearchableSelectField
        id="test"
        label="Actividad"
        name="activity"
        value=""
        options={OPTIONS}
        emptyLabel="— Sin asignar —"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('Hotel'))
    expect(onChange).toHaveBeenCalledWith('HOTEL')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('calls onChange with empty string when emptyLabel option is selected', () => {
    const onChange = vi.fn()
    render(
      <SearchableSelectField
        id="test"
        label="Actividad"
        name="activity"
        value="HOTEL"
        options={OPTIONS}
        emptyLabel="— Sin asignar —"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('button'))
    // emptyLabel option is first in the dropdown
    fireEvent.click(screen.getAllByText('— Sin asignar —')[0])
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('closes dropdown on Escape key', () => {
    render(
      <SearchableSelectField
        id="test"
        label="Actividad"
        name="activity"
        value=""
        options={OPTIONS}
        emptyLabel="— Sin asignar —"
        onChange={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
