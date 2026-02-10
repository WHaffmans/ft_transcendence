
FROM node:20-alpine AS builder

WORKDIR /app

# Copy and build game-ws-protocol package
COPY packages/game-ws-protocol /app/packages/game-ws-protocol
WORKDIR /app/packages/game-ws-protocol
RUN npm install && npm run build

# Copy game-service package files and install dependencies
WORKDIR /app/services/game-service
COPY services/game-service/package*.json ./
RUN npm install

# Copy source code
COPY services/game-service .

# Build
RUN npm run build

# ============================================================================
# RUN STAGE
# ============================================================================
FROM node:20-alpine

WORKDIR /app

# Copy game-ws-protocol package from builder
COPY --from=builder /app/packages/game-ws-protocol ./packages/game-ws-protocol

# Copy package files for installing production dependencies
COPY services/game-service/package*.json ./services/game-service/
WORKDIR /app/services/game-service
RUN npm install --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/services/game-service/dist ./dist


CMD ["npm", "run", "start"]
