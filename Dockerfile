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

# Generate the Prisma client (no DB needed at build time)
RUN npx prisma generate

# Create the uploads directory so avatar uploads work at runtime
RUN mkdir -p uploads/avatars

# Make the entrypoint executable
RUN chmod +x entrypoint.sh

CMD ["sh", "entrypoint.sh"]
