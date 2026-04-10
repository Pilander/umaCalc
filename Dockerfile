# Stage 1: Build frontend + server
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm run build:server

# Stage 2: Production runtime
FROM node:22-alpine
WORKDIR /app

# Install only production dependencies (includes better-sqlite3, express, cors)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built frontend and server
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data

EXPOSE 3001

CMD ["node", "dist-server/index.js"]