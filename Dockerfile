# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Copy public directory explicitly
COPY public/ ./public/

# Copy other necessary files
COPY healthcheck.js ./
COPY *.png ./
COPY *.md ./

# Create uploads directories
RUN mkdir -p public/uploads/profiles public/uploads/alliances

# Create logs directory
RUN mkdir -p logs

# Debug: List files to verify copy
RUN echo "=== Checking file structure ===" && \
    ls -la && \
    echo "=== Checking public directory ===" && \
    ls -la public/ && \
    echo "=== Checking src directory ===" && \
    ls -la src/

# Set permissions
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]