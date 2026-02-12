# Stage 1: Build Stage
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies like @nestjs/cli)
RUN npm install

# Copy the rest of the backend source code
COPY . .

# Build the NestJS application (compiles TS to JS in /dist)
RUN npm run build

# Stage 2: Production Runtime Stage
FROM node:20-alpine

# Set environment to production
ENV NODE_ENV=production

WORKDIR /app

# Copy only the package files
COPY package*.json ./

# Install ONLY production dependencies (no Nest CLI, no test tools)
RUN npm install --only=production

# Copy the compiled code from the builder stage
COPY --from=builder /app/dist ./dist

# Use the built-in non-root 'node' user for security
USER node

# NestJS default port
EXPOSE 3000

# Start the application using the compiled JavaScript
CMD ["node", "dist/main.js"]
