# =================================================================
# FILE: apps/web/Dockerfile
# FINAL, ROBUST VERSION - With corrected CMD path
# =================================================================

# ---- STAGE 1: Base ----
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm turbo

# ---- STAGE 2: Builder ----
FROM base AS builder
COPY . .
RUN yes | pnpm install --frozen-lockfile
RUN pnpm turbo build --filter=web...

# ---- STAGE 3: Runner ----
# This is the final, small production image.
FROM base AS runner

# Set the working directory for the final image
WORKDIR /app

# Don't run production as root for security.
USER node

# Copy the standalone output from the builder stage into the runner's WORKDIR
COPY --from=builder /app/apps/web/.next/standalone .

# Copy the static assets
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

# This is the crucial final command. It now runs 'server.js' from the root of the WORKDIR.
CMD ["node", "server.js"]