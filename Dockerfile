# Stage 1: Build the application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build arguments for Vite environment variables (required at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build with Vite only (skip tsc --noEmit to avoid OOM on constrained build machines).
# TypeScript type-checking should be done in CI, not during Docker image build.
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npx vite build

# Stage 2: Serve with nginx
FROM nginx:stable-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
