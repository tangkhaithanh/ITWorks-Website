# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install Prisma CLI for migrations
RUN npm install -g prisma

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run migrations/db push and start the application
# Nếu có migrations thì dùng migrate deploy, nếu không thì dùng db push
CMD ["sh", "-c", "if [ -d \"prisma/migrations\" ] && [ \"$(ls -A prisma/migrations)\" ]; then npx prisma migrate deploy; else npx prisma db push --accept-data-loss; fi && node dist/src/main"]

