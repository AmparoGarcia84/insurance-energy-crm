# Insurance & Energy CRM

CRM for an insurance and energy brokerage. Manages clients, policies, energy contracts, sales pipeline, cases and employee time tracking.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| i18n | i18next (ES / EN) |
| Tests | Vitest + React Testing Library |

## Monorepo structure

```
insurance-energy-crm/
├── frontend/    ← React app
├── backend/     ← REST API
├── shared/      ← shared TypeScript types
└── package.json ← npm workspaces root
```

## Getting started

```bash
# Install all dependencies
npm install

# Start frontend
npm run dev:frontend

# Start backend
npm run dev:backend

# Run all tests
npm run test
```

## Workspaces

| Package | Name |
|---------|------|
| `frontend/` | `@crm/frontend` |
| `backend/` | `@crm/backend` |
| `shared/` | `@crm/shared` |
