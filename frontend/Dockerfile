FROM node:22-alpine AS deps
WORKDIR /app

# Copy workspace manifests (monorepo root + workspaces)
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/

RUN npm ci --workspace=frontend --include-workspace-root

# ── dev: vite dev server ──────────────────────────────────────────────────────
FROM deps AS dev
COPY frontend/ ./frontend/
WORKDIR /app/frontend
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]

# ── test: vitest single run ───────────────────────────────────────────────────
FROM deps AS test
COPY frontend/ ./frontend/
WORKDIR /app/frontend
CMD ["npm", "run", "test:coverage"]

# ── build: production bundle ──────────────────────────────────────────────────
FROM deps AS build
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm run build

# ── prod: serve with nginx ────────────────────────────────────────────────────
FROM nginx:alpine AS prod
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
