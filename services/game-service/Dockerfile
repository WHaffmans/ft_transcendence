
# ============================================================================
# PRUNE STAGE - Generate minimal monorepo
# ============================================================================
FROM node:22-alpine AS pruner

RUN apk add --no-cache libc6-compat
RUN npm install -g turbo

WORKDIR /app
COPY . .
RUN turbo prune @ft/game-service --docker

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
RUN npm run -w @ft/game-service build

# ============================================================================
# RUN STAGE - Production image
# ============================================================================
FROM node:22-alpine

WORKDIR /app

# Copy pruned package files for production install
COPY --from=pruner /app/out/json/ .
RUN npm ci --omit=dev --ignore-scripts

# Copy built artifacts
COPY --from=builder /app/packages/game-ws-protocol/dist ./packages/game-ws-protocol/dist
COPY --from=builder /app/packages/game-ws-protocol/package.json ./packages/game-ws-protocol/
COPY --from=builder /app/services/game-service/dist ./services/game-service/dist

WORKDIR /app/services/game-service

EXPOSE 3443

CMD ["node", "dist/index.js"]
