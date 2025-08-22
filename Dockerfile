# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install all dependencies including devDependencies
RUN npm install
RUN cd server && npm install

# Copy app source
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install only production dependencies
RUN npm install --only=production
RUN cd server && npm install --only=production

# Copy built files from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/server ./server

# Set environment to production
ENV NODE_ENV=production
ENV PORT=10000

# Create uploads directory
RUN mkdir -p /usr/src/app/server/uploads/items
RUN mkdir -p /usr/src/app/server/uploads/projects

# Expose the app port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:10000/api/health || exit 1

# Make the start script executable
RUN chmod +x /usr/src/app/start.sh

# Start the app
CMD ["/usr/src/app/start.sh"]
