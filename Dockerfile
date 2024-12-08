# Stage 1: Build stage
FROM node:22 AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Development stage
FROM node:22 AS development

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the application code
COPY . .

# Expose the application port
EXPOSE 3000

# Install global dependencies for development
RUN npm install -g @nestjs/cli

# Default command for development
CMD ["npm", "run", "start:dev"]

# Stage 3: Production stage (default)
FROM node:22 AS production

# Set the working directory
WORKDIR /usr/src/app

# Install Chromium for headless browser functionality
RUN apt-get update && apt-get install -y \
  chromium \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# Install only production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy the build artifacts from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy any necessary configuration files
COPY .env ./

# Expose the application port
EXPOSE 3000

# Default command
CMD ["node", "dist/src/main"]
