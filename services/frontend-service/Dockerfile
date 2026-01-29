# ============================================================================
# BUILD STAGE
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for certificate generation
RUN apk add --no-cache openssl

# Copy package files
COPY package.json package-lock.json* npm-shrinkwrap.json* ./

# Install all dependencies (including devDependencies needed for build)
RUN npm install

# Copy source code
COPY . .

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

# Copy package files for installing production dependencies
COPY package.json package-lock.json* ./

# Install only production dependencies (omit devDependencies)
RUN npm install --omit=dev --ignore-scripts

# Copy built application from builder stage
COPY --from=builder /app/build ./build

# Copy SSL certificates from builder stage
# COPY --from=builder /app/certs ./certs

# Copy production server script
COPY production-server.js ./

# Start production server with HTTPS
CMD ["node", "production-server.js"]
