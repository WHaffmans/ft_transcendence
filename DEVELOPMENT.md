# Development Workflow

## 🚀 Quick Start

### Development Mode (Hot Reload)
```bash
# Start all services with hot reload
docker-compose up -d

# View logs
docker-compose logs -f user-service

# Stop services
docker-compose down
```

**Changes to `/services/user-service/src/**` will automatically reload!**

### Production Mode
```bash
# Build and run with production config
docker-compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d --build

# Stop
docker-compose down
```

## 📝 Development Setup

### Prerequisites
- ✅ npm installed (via `sudo pacman -S npm`)
- ✅ Docker and Docker Compose

### First Time Setup
```bash
# Install dependencies for IntelliSense
cd services/user-service
npm install
```

## 🔥 Hot Reload Features

**What gets hot reloaded:**
- ✅ TypeScript files in `src/`
- ✅ Automatic recompilation
- ✅ Instant server restart
- ✅ No container rebuild needed

**What requires rebuild:**
- ⚠️ Changes to `package.json` (new dependencies)
- ⚠️ Changes to `Dockerfile` or `tsconfig.json`

## 🛠️ Common Tasks

### Add a new service
1. Create service in `services/new-service/`
2. Run `npm install` in that directory
3. Add to docker-compose.yaml with volume mounts
4. Use `Dockerfile.dev` for development

### Test API endpoints
```bash
# Health check
curl -H "Host: transcendence.duinvoetje.nl" http://localhost/api/health

# Create user
curl -H "Host: transcendence.duinvoetje.nl" \
  -X POST http://localhost/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "test"}'

# Get all users
curl -H "Host: transcendence.duinvoetje.nl" http://localhost/api/users
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f user-service

# Last 50 lines
docker-compose logs --tail=50 user-service
```

### Rebuild after dependency changes
```bash
docker-compose up -d --build user-service
```

## 🎯 Best Practices

1. **Edit code locally** - Changes auto-reload in Docker
2. **Install deps locally** - Better IntelliSense in VS Code
3. **Use production mode** - For final testing before deployment
4. **Check logs** - If hot reload seems stuck

## 🐛 Troubleshooting

### Hot reload not working?
```bash
# Check if tsx watch is running
docker exec user-service ps aux | grep tsx

# Restart the service
docker-compose restart user-service
```

### TypeScript errors in VS Code?
```bash
# Ensure dependencies are installed locally
cd services/user-service
npm install
```

### Service not starting?
```bash
# Check logs
docker-compose logs user-service

# Rebuild from scratch
docker-compose down
docker-compose up -d --build
```
