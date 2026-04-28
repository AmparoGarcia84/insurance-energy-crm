import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BasicSearch from './BasicSearch'

describe('BasicSearch', () => {
  it('renders a search input', () => {
    render(<BasicSearch value="" onChange={vi.fn()} />)
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('displays the provided placeholder', () => {
    render(<BasicSearch value="" onChange={vi.fn()} placeholder="Search clients…" />)
    expect(screen.getByPlaceholderText('Search clients…')).toBeInTheDocument()
  })

  it('displays the current value', () => {
    render(<BasicSearch value="Ana" onChange={vi.fn()} />)
    expect(screen.getByRole('searchbox')).toHaveValue('Ana')
  })

  it('calls onChange with the new value when the user types', () => {
    const onChange = vi.fn()
    render(<BasicSearch value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'test' } })
    expect(onChange).toHaveBeenCalledWith('test')
  })

  it('applies the table-search class on the wrapper', () => {
    const { container } = render(<BasicSearch value="" onChange={vi.fn()} />)
    expect(container.firstChild).toHaveClass('table-search')
  })

  it('appends the extra className to the wrapper', () => {
    const { container } = render(<BasicSearch value="" onChange={vi.fn()} className="tasks-search" />)
    expect(container.firstChild).toHaveClass('table-search')
    expect(container.firstChild).toHaveClass('tasks-search')
  })

  it('forwards id and name to the input', () => {
    render(<BasicSearch value="" onChange={vi.fn()} id="clients-search" name="clients-search" />)
    const input = screen.getByRole('searchbox')
    expect(input).toHaveAttribute('id', 'clients-search')
    expect(input).toHaveAttribute('name', 'clients-search')
  })
})
