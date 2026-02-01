# SovrenAI Workbench - Complete System
# Builds backend + React frontend together

# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /build/frontend-react

COPY frontend-react/package*.json ./
RUN npm ci

COPY frontend-react/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder

WORKDIR /build/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

# Stage 3: Production Image
FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy backend
COPY --from=backend-builder /build/backend/dist ./dist
COPY --from=backend-builder /build/backend/package*.json ./
COPY --from=backend-builder /build/backend/data ./data

# Install production dependencies (this rebuilds native modules for Alpine)
RUN npm ci --only=production

# Copy React frontend build
RUN mkdir -p ./frontend-react
COPY --from=frontend-builder /build/frontend-react/dist ./frontend-react/dist

# Create data directory for runtime
RUN mkdir -p /app/data

# Set environment
ENV NODE_ENV=production
ENV PORT=3750

# Expose port
EXPOSE 3750

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3750/api/v1/diagnostic', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start server (skip diagnostic in Docker, go straight to main)
CMD ["node", "dist/main.js"]
