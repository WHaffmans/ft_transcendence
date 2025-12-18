# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies needed for better-sqlite3 on Alpine
RUN apk add --no-cache python3 make g++ sqlite-dev

COPY package*.json ./
COPY tsconfig.json ./
RUN npm install
COPY src/ ./src/
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules


EXPOSE 3000
CMD ["node", "dist/index.js"]
