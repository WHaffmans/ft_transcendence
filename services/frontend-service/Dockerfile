
# ============================================================================
# PRUNE STAGE - Generate minimal monorepo
# ============================================================================
FROM node:22-alpine AS pruner

RUN apk add --no-cache libc6-compat
RUN npm install -g turbo

WORKDIR /app
COPY . .
RUN turbo prune frontend-service --docker

# ============================================================================
# BUILD STAGE - Install deps and build
# ============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# First install dependencies (using pruned package.json files)
COPY --from=pruner /app/out/json/ .
RUN npm ci

# Copy source code and build
COPY --from=pruner /app/out/full/ .
RUN npm run -w @ft/game-ws-protocol build
RUN npm run -w frontend-service build

# ============================================================================
# RUN STAGE - Production image
# ============================================================================
FROM node:22-alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copy pruned package files for production install
COPY --from=pruner /app/out/json/ .
RUN npm ci --omit=dev --ignore-scripts

# Copy built artifacts
COPY --from=builder /app/packages/game-ws-protocol/dist ./packages/game-ws-protocol/dist
COPY --from=builder /app/packages/game-ws-protocol/package.json ./packages/game-ws-protocol/
COPY --from=builder /app/services/frontend-service/build ./services/frontend-service/build

# Copy production server script
COPY --from=pruner /app/out/full/services/frontend-service/production-server.js ./services/frontend-service/

WORKDIR /app/services/frontend-service

CMD ["node", "production-server.js"]

