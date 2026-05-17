# =================================================================
# FILE: apps/graphql-api/Dockerfile
# (Create this new file)
# =================================================================
# ---- STAGE 1: Builder ----
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

# Copy config and package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/graphql-api ./apps/graphql-api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the graphql-api
RUN pnpm turbo build --filter=graphql-api


# ---- STAGE 2: Runner ----
FROM node:20-alpine AS runner

WORKDIR /app
RUN npm install -g pnpm

# Copy package manifests from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/apps/graphql-api/package.json ./apps/graphql-api/package.json

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile --filter=graphql-api...

# Copy compiled code from builder
COPY --from=builder /app/apps/graphql-api/dist ./apps/graphql-api/dist

# Command to run the application
CMD ["node", "apps/graphql-api/dist/index.js"]