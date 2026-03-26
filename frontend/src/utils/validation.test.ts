import { describe, it, expect } from 'vitest'
import { isValidPhone, isValidNifCif, isValidEmail, isValidWebsite, isValidIban } from './validation'

describe('isValidPhone', () => {
  it('accepts empty string (field is optional)', () => {
    expect(isValidPhone('')).toBe(true)
  })

  it('accepts 9-digit mobile number without prefix', () => {
    expect(isValidPhone('612345678')).toBe(true)
  })

  it('accepts 9-digit number with spaces', () => {
    expect(isValidPhone('612 345 678')).toBe(true)
  })

  it('accepts number with Spanish country prefix', () => {
    expect(isValidPhone('+34 612 345 678')).toBe(true)
    expect(isValidPhone('+34612345678')).toBe(true)
  })

  it('accepts number with other country prefix', () => {
    expect(isValidPhone('+1 800 555 0100')).toBe(true)
    expect(isValidPhone('+44 7911 123456')).toBe(true)
  })

  it('accepts number with dots or dashes as separators', () => {
    expect(isValidPhone('612.345.678')).toBe(true)
    expect(isValidPhone('612-345-678')).toBe(true)
  })

  it('rejects a string with fewer than 6 digits', () => {
    expect(isValidPhone('1234')).toBe(false)
  })

  it('rejects a string with more than 15 digits', () => {
    expect(isValidPhone('1234567890123456')).toBe(false)
  })

  it('rejects letters mixed in', () => {
    expect(isValidPhone('6abc45678')).toBe(false)
  })
})

describe('isValidNifCif', () => {
  it('accepts empty string (field is optional)', () => {
    expect(isValidNifCif('')).toBe(true)
  })

  it('accepts a valid NIF', () => {
    expect(isValidNifCif('12345678A')).toBe(true)
    expect(isValidNifCif('00000001R')).toBe(true)
  })

  it('accepts a valid NIE starting with X, Y or Z', () => {
    expect(isValidNifCif('X1234567A')).toBe(true)
    expect(isValidNifCif('Y0000001R')).toBe(true)
    expect(isValidNifCif('Z9999999J')).toBe(true)
  })

  it('accepts a valid CIF', () => {
    expect(isValidNifCif('A12345678')).toBe(true)
    expect(isValidNifCif('B87654321')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isValidNifCif('12345678a')).toBe(true)
    expect(isValidNifCif('a12345678')).toBe(true)
  })

  it('rejects too few digits', () => {
    expect(isValidNifCif('1234A')).toBe(false)
  })

  it('rejects letters where digits are expected', () => {
    expect(isValidNifCif('ABCDEFGHI')).toBe(false)
  })

  it('rejects a completely random string', () => {
    expect(isValidNifCif('notanif')).toBe(false)
  })
})

describe('isValidEmail', () => {
  it('accepts empty string (field is optional)', () => {
    expect(isValidEmail('')).toBe(true)
  })

  it('accepts a standard email', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('user.name+tag@sub.domain.org')).toBe(true)
  })

  it('rejects address without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false)
  })

  it('rejects address without domain', () => {
    expect(isValidEmail('user@')).toBe(false)
  })

  it('rejects address with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false)
  })
})

describe('isValidWebsite', () => {
  it('accepts empty string (field is optional)', () => {
    expect(isValidWebsite('')).toBe(true)
  })

  it('accepts www. prefix without protocol', () => {
    expect(isValidWebsite('www.example.com')).toBe(true)
  })

  it('accepts URL with https', () => {
    expect(isValidWebsite('https://example.com')).toBe(true)
  })

  it('accepts URL with http', () => {
    expect(isValidWebsite('http://www.example.com')).toBe(true)
  })

  it('accepts domain without www or protocol', () => {
    expect(isValidWebsite('example.com')).toBe(true)
  })

  it('accepts domain with path', () => {
    expect(isValidWebsite('www.example.com/page')).toBe(true)
  })

  it('accepts multi-part TLD', () => {
    expect(isValidWebsite('www.example.co.uk')).toBe(true)
  })

  it('rejects plain text without a dot', () => {
    expect(isValidWebsite('notawebsite')).toBe(false)
  })

  it('rejects string with spaces', () => {
    expect(isValidWebsite('www.my site.com')).toBe(false)
  })
})

describe('isValidIban', () => {
  it('accepts empty string (field is optional)', () => {
    expect(isValidIban('')).toBe(true)
  })

  it('accepts valid Spanish IBAN without spaces', () => {
    expect(isValidIban('ES9121000418450200051332')).toBe(true)
  })

  it('accepts valid Spanish IBAN with spaces', () => {
    expect(isValidIban('ES91 2100 0418 4502 0005 1332')).toBe(true)
  })

  it('accepts valid German IBAN', () => {
    expect(isValidIban('DE89370400440532013000')).toBe(true)
  })

  it('accepts valid French IBAN', () => {
    expect(isValidIban('FR7630006000011234567890189')).toBe(true)
  })

  it('rejects IBAN with wrong checksum', () => {
    expect(isValidIban('ES9221000418450200051332')).toBe(false)
  })

  it('rejects IBAN that is too short', () => {
    expect(isValidIban('ES91210004')).toBe(false)
  })

  it('rejects IBAN with invalid characters', () => {
    expect(isValidIban('ES91 2100 XXXX 4502 0005 1332')).toBe(false)
  })

  it('rejects plain text', () => {
    expect(isValidIban('not-an-iban')).toBe(false)
  })
})
