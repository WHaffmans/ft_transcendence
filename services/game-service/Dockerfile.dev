
FROM node:20-alpine

WORKDIR /app

COPY --from=game-ws-protocol / /packages/game-ws-protocol

RUN cd /packages/game-ws-protocol \
  && if [ -f package-lock.json ]; then npm ci; else npm install; fi \
  && npm run build

COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 3002 3003

CMD ["npm", "run", "dev"]
