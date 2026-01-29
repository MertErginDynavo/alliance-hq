# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy entire src directory (includes public)
COPY src/ ./src/

# Copy other necessary files
COPY healthcheck.js ./

# Create logs directory
RUN mkdir -p logs

# Debug: List files to verify copy
RUN echo "=== Checking file structure ===" && \
    ls -la && \
    echo "=== Checking src directory ===" && \
    ls -la src/ && \
    echo "=== Checking src/public directory ===" && \
    ls -la src/public/

# Set permissions
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]