# ---- STAGE 1: Builder ----
# This stage builds the application. It starts by installing all
# dependencies, pruning the monorepo to only what's needed for our
# service, and then running the TypeScript compiler.
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy files required to install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/data-ingestion-service ./apps/data-ingestion-service

# Install all dependencies for the entire monorepo. This is necessary
# to get the `turbo` CLI and other dev dependencies.
RUN pnpm install --frozen-lockfile

# Run the build command for our specific service using Turborepo.
# Turbo will cache this and ensure dependencies are built first.
# This creates the 'dist' folder inside ./apps/data-ingestion-service/
RUN pnpm turbo build --filter=data-ingestion-service


# ---- STAGE 2: Runner ----
# This is the final, lean production image. It starts fresh and only
# copies over the necessary artifacts from the 'builder' stage.
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Create the application's directory structure
RUN mkdir -p apps/data-ingestion-service

# Copy the pruned package manifests and lockfile from the 'builder' stage.
# We will use 'turbo prune' in the builder to create a minimal set of dependencies.
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/apps/data-ingestion-service/package.json ./apps/data-ingestion-service/package.json

# Install ONLY production dependencies. This is much faster and results in a smaller image.
RUN pnpm install --prod --frozen-lockfile --filter=data-ingestion-service...

# Copy the compiled application code from the builder stage.
COPY --from=builder /app/apps/data-ingestion-service/dist ./apps/data-ingestion-service/dist

# The final command to run the application
CMD ["node", "apps/data-ingestion-service/dist/index.js"]