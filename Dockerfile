# Stage 1: Build the application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build arguments for Vite environment variables (required at build time).
# On DigitalOcean App Platform, set these as BUILD_TIME secrets in the dashboard.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Fail fast if required env vars are not set
RUN if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then \
      echo ""; \
      echo "==========================================================="; \
      echo "ERROR: Required build-time environment variables are missing"; \
      echo "==========================================================="; \
      echo ""; \
      echo "  VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-(not set)}"; \
      echo "  VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY:-(not set)}"; \
      echo ""; \
      echo "For DigitalOcean App Platform:"; \
      echo "  1. Go to your app settings in the DO dashboard"; \
      echo "  2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"; \
      echo "     as App-Level Environment Variables"; \
      echo "  3. Set scope to BUILD_TIME, type to SECRET"; \
      echo "  4. Redeploy the app"; \
      echo ""; \
      echo "For local Docker build:"; \
      echo "  docker build \\"; \
      echo "    --build-arg VITE_SUPABASE_URL=https://xxx.supabase.co \\"; \
      echo "    --build-arg VITE_SUPABASE_ANON_KEY=eyJ... \\"; \
      echo "    -t ai-exam-cloud ."; \
      echo ""; \
      exit 1; \
    fi

# Build with Vite only (skip tsc --noEmit to avoid OOM on constrained build machines).
# TypeScript type-checking should be done in CI, not during Docker image build.
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npx vite build

# Stage 2: Serve with nginx
FROM nginx:stable-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
