/**
 * Returns true if the string contains a valid phone number.
 * Accepts optional country prefix (+34, +1, etc.), spaces, dots, dashes and parentheses.
 * Requires between 6 and 15 actual digits.
 */
export function isValidPhone(value: string): boolean {
  if (!value) return true
  const digits = value.replace(/\D/g, '')
  if (digits.length < 6 || digits.length > 15) return false
  return /^(\+\d{1,3}[\s.\-]?)?[\d\s.\-()]+$/.test(value.trim())
}

/**
 * Returns true if the string is a valid Spanish NIF, NIE or CIF.
 *
 * - NIF:  8 digits + 1 letter  (e.g. 12345678A)
 * - NIE:  X/Y/Z + 7 digits + 1 letter  (e.g. X1234567A)
 * - CIF:  1 org letter + 7 digits + 1 letter or digit  (e.g. A12345678)
 */
export function isValidNifCif(value: string): boolean {
  if (!value) return true
  return /^(\d{8}[A-Z]|[XYZ]\d{7}[A-Z]|[A-HJNP-SUVW]\d{7}[0-9A-J])$/i.test(value.trim())
}

/**
 * Returns true if the string is a valid e-mail address.
 */
export function isValidEmail(value: string): boolean {
  if (!value) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/**
 * Returns true if the string is a valid website URL.
 * Accepts with or without protocol (http/https) and with or without www.
 * e.g. "www.example.com", "https://example.com", "example.co.uk"
 */
export function isValidWebsite(value: string): boolean {
  if (!value) return true
  return /^(https?:\/\/)?(www\.)?[\w-]+(\.[\w-]{2,})+(\/[\w\-./?%&=]*)?$/i.test(value.trim())
}
