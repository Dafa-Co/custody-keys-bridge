# base stage
FROM node:22-slim

# Install required packages (including procps for ps command)
RUN apt-get update && apt-get install -y procps && rm -rf /var/lib/apt/lists/*


# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install NPM packages
RUN npm install

# Copy the local code to the container's workspace
COPY . .

# Command to run the application
CMD ["npm", "run", "start:dev"]
