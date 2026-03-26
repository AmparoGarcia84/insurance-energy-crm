import { describe, it, expect, vi, beforeEach } from 'vitest'
import { lookupPostalCode } from './postalCode'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockResponse(data: unknown, ok = true) {
  mockFetch.mockResolvedValueOnce({
    ok,
    json: async () => data,
  })
}

describe('lookupPostalCode', () => {
  beforeEach(() => mockFetch.mockClear())

  it('returns null for empty string', async () => {
    expect(await lookupPostalCode('')).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns null for non-Spanish format (not 5 digits)', async () => {
    expect(await lookupPostalCode('1234')).toBeNull()
    expect(await lookupPostalCode('ABCDE')).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('calls the correct URL for a 5-digit code', async () => {
    mockResponse({ places: [{ 'place name': 'Madrid', state: 'Madrid' }], 'country abbreviation': 'ES', country: 'Spain' })
    await lookupPostalCode('28001')
    expect(mockFetch).toHaveBeenCalledWith('https://api.zippopotam.us/es/28001')
  })

  it('returns city, province and Spanish country name', async () => {
    mockResponse({
      'country abbreviation': 'ES',
      country: 'Spain',
      places: [{ 'place name': 'Barcelona', state: 'Cataluña' }],
    })
    const result = await lookupPostalCode('08001')
    expect(result).toEqual({ city: 'Barcelona', province: 'Cataluña', country: 'España' })
  })

  it('trims whitespace before processing', async () => {
    mockResponse({
      'country abbreviation': 'ES',
      country: 'Spain',
      places: [{ 'place name': 'Sevilla', state: 'Sevilla' }],
    })
    const result = await lookupPostalCode('  41001  ')
    expect(result).toEqual({ city: 'Sevilla', province: 'Sevilla', country: 'España' })
  })

  it('returns null when API responds with 404', async () => {
    mockResponse({}, false)
    expect(await lookupPostalCode('99999')).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    expect(await lookupPostalCode('28001')).toBeNull()
  })

  it('returns null when places array is empty', async () => {
    mockResponse({ 'country abbreviation': 'ES', country: 'Spain', places: [] })
    expect(await lookupPostalCode('28001')).toBeNull()
  })
})
