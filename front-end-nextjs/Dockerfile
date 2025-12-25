FROM node:18-alpine AS base
# Set working directory
WORKDIR /app            
# Install dependencies
COPY package.json yarn.lock*  package-lock.json* pnpm-lock.yaml* ./

# Install dependencies
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm install; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install; \
  else echo "Lockfile not found." && exit 1; \
  fi



# Copy application code
COPY . .
# Build the application
RUN npm run build

# # Production stage
# FROM node:18-alpine AS production
# WORKDIR /app
# COPY --from=base /app ./

# Expose port
EXPOSE 3000
# Start the application
CMD ["npm", "start"]