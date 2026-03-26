/**
 * db_provision/import-clients.ts — Import clients from a Zoho CRM CSV export
 *
 * Usage:
 *   npm run import-clients -- path/to/Clientes_2026_03_25.csv
 *
 * Notes:
 * - Zoho exports CSVs in Latin-1 encoding — handled automatically
 * - Skips clients whose NIF already exists in the database
 * - Two-pass approach: first creates all clients, then resolves hierarchy (mainClientId)
 * - clientNumber = 0 in the CSV is treated as "no client number" (auto-generated)
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { importClientsFromCsv } from '../src/services/client.service.js'

async function main() {
  const csvPath = process.argv[2]
  if (!csvPath) {
    console.error('Usage: npm run import-clients -- path/to/Clientes.csv')
    process.exit(1)
  }

  const resolvedPath = path.resolve(csvPath)
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`)
    process.exit(1)
  }

  console.log(`Reading CSV: ${resolvedPath}`)
  // Auto-detect encoding: try UTF-8 first, fall back to Latin-1
  const rawBuffer = fs.readFileSync(resolvedPath)
  let csvText: string
  try {
    csvText = new TextDecoder('utf-8', { fatal: true }).decode(rawBuffer)
  } catch {
    csvText = new TextDecoder('latin1').decode(rawBuffer)
  }

  const result = await importClientsFromCsv(csvText)

  console.log(`\n  ✓ Created ${result.created} clients, skipped ${result.skipped}`)
  if (result.errors.length > 0) {
    console.log(`  ✗ Errors (${result.errors.length}):`)
    result.errors.forEach(e => console.log(`    - ${e}`))
  }
  console.log('\nImport complete.')
}

main().catch(console.error)
