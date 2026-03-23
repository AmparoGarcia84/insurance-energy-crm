/**
 * db/prisma.ts — Shared Prisma client instance
 *
 * Exports a single PrismaClient configured to use the pg adapter so that
 * Prisma communicates with PostgreSQL via the native `pg` driver instead of
 * the default binary engine. This is necessary for edge and serverless
 * environments, and also keeps connection handling consistent across all
 * services in this backend.
 *
 * All database access in the application must import this module rather than
 * instantiating PrismaClient directly — having one shared instance prevents
 * connection pool exhaustion during development hot-reloads.
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

// The DATABASE_URL environment variable must be set before the server starts.
// The non-null assertion (!) is intentional: a missing URL is a fatal
// misconfiguration that should crash loudly at startup.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export default prisma
