# Dockerfile for Kaixa Jr
# Multi-stage build for production

# Stage 1: Dependencies
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Stage 2: Production
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S kaixa -u 1001

# Copy dependencies from stage 1
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY --chown=kaixa:nodejs . .

# Switch to non-root user
USER kaixa

# Expose port (if needed for future web interface)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Default command
CMD ["node", "src/core/agent.js"]
