# Use Node.js LTS as base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the Vite application
RUN npm run build

# Expose ports for both frontend and backend
EXPOSE 3005
EXPOSE 5173

# Start both servers
RUN chmod +x start.sh
CMD ["./start.sh"]
