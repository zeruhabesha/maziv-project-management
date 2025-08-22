# Use Node.js 20
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd server && npm install

# Copy app source
COPY . .

# Build the app
RUN npm run build

# Set environment to production
ENV NODE_ENV=production

# Expose the app port
EXPOSE 10000

# Start the app
CMD ["npm", "start"]
