FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── dev: vite dev server ──────────────────────────────────────────────────────
FROM deps AS dev
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]

# ── test: vitest single run ───────────────────────────────────────────────────
FROM deps AS test
COPY . .
CMD ["npm", "run", "test:run"]

# ── build: production bundle ──────────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN npm run build

# ── prod: serve with nginx ────────────────────────────────────────────────────
FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
