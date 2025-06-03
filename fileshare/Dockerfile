# Use Node.js LTS as base image
FROM node:22
EXPOSE 8080

# Set working directory
WORKDIR /app

COPY . /app

# Install dependencies
RUN npm install

# Start both servers
CMD ["./run"]
