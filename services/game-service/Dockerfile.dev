
# services/game-service/Dockerfile.dev
FROM node:20-bookworm-slim

# Avoid npm update-notifier noise in containers
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /app

# Install deps first
COPY package.json ./
COPY package-lock.json* ./

RUN npm install --no-audit --no-fund

# Copy config files for TypeScript
COPY tsconfig.json ./

# Copy sources for the initial image build
COPY src ./src

EXPOSE 3002 3003

# Expect package.json to have a dev script
CMD ["npm", "run", "dev"]
