FROM node:22-slim

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
