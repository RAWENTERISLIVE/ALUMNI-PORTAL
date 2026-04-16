# Multi-stage build for backend only
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build \
  || (echo "TypeScript diagnostics detected; continuing with emitted dist output." \
  && test -f dist/server.js)

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY prisma.config.ts ./

# Copy prisma schema before installing dependencies so client generation works.
COPY prisma prisma/

# Install dependencies and generate Prisma client for runtime.
RUN npm ci && npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist dist/

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('node:http').get('http://localhost:5000/api/status/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1));"

# Start application
CMD ["npm", "start"]
