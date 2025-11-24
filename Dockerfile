## syntax=docker/dockerfile:1.7
# Multi-stage build for Cloud Run

FROM node:20-alpine AS builder
WORKDIR /app

# Install OS deps (optional) and set production env
ENV NODE_ENV=production

# Copy only manifests first for better caching
COPY package.json package-lock.json ./

# Install all dependencies (including dev) to run prisma generate and build
# --ignore-scripts prevents husky from running
RUN npm ci --ignore-scripts

# Copy Prisma schema to allow client generation
COPY prisma ./prisma

# Generate Prisma Client (engines will be included in node_modules)
RUN npx prisma generate

# Copy source and ts configs, then build TypeScript
COPY tsconfig*.json ./
COPY src ./src

RUN npm run build

# Prune devDependencies to shrink runtime image
RUN npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy production node_modules (already pruned) and built dist from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Expose the Cloud Run port (will be provided via $PORT)
ENV PORT=3000
EXPOSE 3000

# Start the server
CMD ["node", "dist/main/server.js"]
