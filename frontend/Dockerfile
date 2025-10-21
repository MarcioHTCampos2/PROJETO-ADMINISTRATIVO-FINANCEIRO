FROM node:22.14.0-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Verify source files are copied
RUN ls -la src/
RUN cat src/index.js

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]