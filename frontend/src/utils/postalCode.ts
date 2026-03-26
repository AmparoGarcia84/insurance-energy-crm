export interface PostalCodeInfo {
  city: string
  province: string
  country: string
}

// Country abbreviation → Spanish name for the most common cases
const COUNTRY_NAMES: Record<string, string> = {
  ES: 'España',
  PT: 'Portugal',
  FR: 'Francia',
  IT: 'Italia',
  DE: 'Alemania',
  GB: 'Reino Unido',
  US: 'Estados Unidos',
  MX: 'México',
  AR: 'Argentina',
  CO: 'Colombia',
}

/**
 * Look up city, province and country for a postal code using the zippopotam.us public API.
 * Infers the country from the postal code format:
 *   - 5 digits → Spain (ES)
 *   - other formats remain for future extension
 *
 * Returns null if the postal code is not found or the request fails.
 */
export async function lookupPostalCode(code: string): Promise<PostalCodeInfo | null> {
  const trimmed = code.trim()
  if (!trimmed) return null

  // Determine country from postal code format (currently only Spain)
  const countryCode = /^\d{5}$/.test(trimmed) ? 'ES' : null
  if (!countryCode) return null

  try {
    const res = await fetch(`https://api.zippopotam.us/${countryCode.toLowerCase()}/${trimmed}`)
    if (!res.ok) return null

    const data = await res.json()
    const place = data.places?.[0]
    if (!place) return null

    return {
      city:     place['place name'] ?? '',
      province: place['state']      ?? '',
      country:  COUNTRY_NAMES[data['country abbreviation']] ?? data['country'] ?? '',
    }
  } catch {
    return null
  }
}
