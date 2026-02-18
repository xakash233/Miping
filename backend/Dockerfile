# Use Node 20 (recommended for joi 18)
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --omit=dev

# Copy all source files
COPY . .

# Expose backend port
EXPOSE 5000

# Start server directly
CMD ["node", "src/server.js"]

