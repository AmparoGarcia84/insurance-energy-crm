/**
 * backend/src/index.ts — HTTP server entry point
 *
 * Loads environment variables and starts the HTTP server.
 * All Express app configuration lives in app.ts so that it can be
 * imported by tests without binding a port.
 */
import 'dotenv/config'
import { app } from './app.js'

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
