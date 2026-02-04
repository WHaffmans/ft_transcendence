
# ============================================================================
# BUILD STAGE
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for certificate generation
RUN apk add --no-cache openssl

# Copy game-ws-protocol package
COPY packages/game-ws-protocol /app/packages/game-ws-protocol

# Build the shared package
WORKDIR /app/packages/game-ws-protocol
RUN npm install && npm run build

# Copy frontend service package files
WORKDIR /app
COPY services/frontend-service/package.json services/frontend-service/package-lock.json* ./

# Install all dependencies (including devDependencies needed for build)
RUN npm install

# Copy frontend source code
COPY services/frontend-service .

# Build the production bundle
RUN npm run build

# Generate self-signed certificate with SANs
# RUN mkdir -p /app/certs && \
# 	openssl req -x509 -newkey rsa:4096 -nodes \
# 	-keyout /app/certs/key.pem \
# 	-out /app/certs/cert.pem \
# 	-days 365 \
# 	-subj "/C=US/ST=State/L=City/O=Organization/CN=frontend-service" \
# 	-addext "subjectAltName=DNS:frontend-service,DNS:localhost,IP:127.0.0.1"

# ============================================================================
# RUN STAGE
# ============================================================================
FROM node:20-alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copy game-ws-protocol package from builder
COPY --from=builder /app/packages/game-ws-protocol ./packages/game-ws-protocol

# Copy package files for installing production dependencies
COPY services/frontend-service/package.json services/frontend-service/package-lock.json* ./

# Install only production dependencies (omit devDependencies)
RUN npm install --omit=dev --ignore-scripts

# Copy built application from builder stage
COPY --from=builder /app/build ./build

# Copy SSL certificates from builder stage
# COPY --from=builder /app/certs ./certs

# Copy production server script
COPY services/frontend-service/production-server.js ./

# Start production server with HTTPS
CMD ["node", "production-server.js"]

