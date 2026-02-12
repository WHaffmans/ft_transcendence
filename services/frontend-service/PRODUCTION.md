# Frontend Service - Production Setup

## Current Production Configuration

### Build Setup
- **Multi-stage Docker build** with separate builder and runtime stages
- **Adapter**: `@sveltejs/adapter-node` for explicit Node.js deployment
- **SSL/TLS**: Self-signed certificates generated during build
  - Certificate includes SANs: `frontend-service`, `localhost`, `127.0.0.1`
  - Valid for 365 days
  - 4096-bit RSA key

### Runtime Configuration
- **Server**: Custom Node.js HTTPS server (`production-server.js`)
- **Port**: 3000 (HTTPS)
- **Environment**: `NODE_ENV=production`
- **Host**: `0.0.0.0` (accessible from all interfaces)
- **Restart Policy**: `unless-stopped`
- **Graceful Shutdown**: Handles SIGTERM/SIGINT signals

### Security
- HTTPS enforced with TLS certificates
- No source code volumes in production
- Production dependencies only (no devDependencies)
- Self-contained image (no host dependencies)

### Health Check
- Endpoint: `https://localhost:3000/health`
- Uses curl with `-k` flag (accepts self-signed cert)
- Interval: 10s
- Start period: 10s
- Timeout: 5s
- Retries: 3

## Optional Improvements for Future Consideration

### 1. Compression
Add gzip/brotli compression to `production-server.js` for better performance:
```javascript
const compression = require('compression');
app.use(compression());
```

**Note**: Check if Traefik gateway already handles compression before implementing.

### 2. Security Headers
Add HTTP security headers to responses:
- HSTS (Strict-Transport-Security)
- X-Frame-Options
- X-Content-Type-Options
- Content-Security-Policy

**Note**: These may already be configured at the Traefik gateway level.

### 3. Request Logging
Add structured access logs for production debugging:
- Request method, path, status code
- Response time
- User agent
- Error tracking

### 4. Monitoring & Metrics
Consider adding:
- Prometheus metrics endpoint
- Application performance monitoring (APM)
- Error tracking (e.g., Sentry)

### 5. Certificate Management
Current self-signed certificates expire after 365 days. Consider:
- Automated certificate renewal
- Using Let's Encrypt for production domains
- Mounting certificates from external volume for easier rotation

### 6. Build Optimization
Potential improvements:
- Layer caching optimization
- Smaller base image (distroless)
- Bundle size analysis

## Files Involved

- `Dockerfile` - Production build configuration
- `production-server.js` - HTTPS server implementation
- `docker-compose.prod.yaml` - Production orchestration
- `svelte.config.js` - SvelteKit adapter configuration
- `package.json` - Dependencies including `@sveltejs/adapter-node`

## Running Production Build

```bash
# Build and start production stack
docker-compose -f docker-compose.prod.yaml up --build

# View logs
docker-compose -f docker-compose.prod.yaml logs -f frontend-service
```

## Testing SSL Certificate

```bash
# Test certificate from inside container
docker exec frontend-service openssl s_client -connect localhost:3000

# Check certificate details
docker exec frontend-service openssl x509 -in /app/certs/cert.pem -text -noout
```
