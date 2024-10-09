# base stage to have npm installed
FROM node:20-alpine3.18 AS base

# Install dependencies required by Puppeteer
RUN apk add --no-cache \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    chromium \
    alsa-lib \
    bash

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# development stage
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install NPM packages
RUN npm install

# Copy the local code to the container's workspace.
COPY . .

# Command to run the application
CMD ["npm", "run", "start:dev"]
