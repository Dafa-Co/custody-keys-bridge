FROM node:22-slim

WORKDIR /usr/src/app

# Leverage caching for dependencies
COPY package*.json ./
RUN npm ci

# Copy the application code
COPY . .

# Command to run the application
CMD ["npm", "run", "start:dev"]
