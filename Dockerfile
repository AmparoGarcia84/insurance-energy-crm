FROM node:22-alpine

WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

RUN npm install

# Copy source
COPY shared/ ./shared/
COPY backend/ ./backend/

WORKDIR /app/backend

RUN npx prisma generate

CMD ["npm", "start"]
