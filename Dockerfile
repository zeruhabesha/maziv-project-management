# Use Node.js 20
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd server && npm install

# Copy application code
COPY . .

# Copy environment files
COPY server/.env.production /app/server/.env

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Create necessary directories
RUN mkdir -p /app/server/uploads/items \
    && mkdir -p /app/server/uploads/projects \
    && chmod -R 777 /app/server/uploads

# Build the application
RUN npm run build

# Set working directory to server
WORKDIR /app/server

# Expose the port the app runs on
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:10000/api/health || exit 1

# Start command
CMD ["node", "--experimental-modules", "--es-module-specifier-resolution=node", "app.js"]
