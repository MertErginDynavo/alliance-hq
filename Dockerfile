# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy everything
COPY . .

# Create uploads directory
RUN mkdir -p public/uploads/profiles public/uploads/alliances

# Create logs directory
RUN mkdir -p logs

# List files for debugging
RUN ls -la
RUN ls -la public/

# Set permissions
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]