// Global environment variables required by the backend at module load time.
// These are set before any test file imports the app or its dependencies.
process.env.JWT_SECRET = 'test-secret-key-for-testing-only'
process.env.NODE_ENV = 'test'
// Prevents PrismaPg from crashing when the module is loaded.
// No real DB connection is made in unit/integration tests — services are mocked.
process.env.DATABASE_URL = 'postgresql://localhost/test_never_connected'
