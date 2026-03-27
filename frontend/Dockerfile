FROM node:22-alpine AS deps
WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/

# Install all workspaces so npm links @crm/shared correctly
RUN npm ci

# Copy shared source (symlinked as @crm/shared in node_modules)
COPY shared/ ./shared/

# ── dev: vite dev server ──────────────────────────────────────────────────────
FROM deps AS dev
COPY frontend/ ./frontend/
WORKDIR /app/frontend
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]

# ── test: vitest + coverage ───────────────────────────────────────────────────
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
