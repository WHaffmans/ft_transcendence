# User Service

A simple TypeScript/Fastify microservice providing CRUD operations for usernames.

## Features

- ✅ Create users with unique usernames
- ✅ Read all users or individual users by ID
- ✅ Update usernames
- ✅ Delete users
- ✅ In-memory storage (for development)
- ✅ Input validation
- ✅ Duplicate username prevention

## API Endpoints

### Health Check
```
GET /health
```
Returns service status.

**Response:**
```json
{
  "status": "ok",
  "service": "user-service"
}
```

### Get All Users
```
GET /users
```
Returns all users.

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "username": "john_doe",
      "createdAt": "2025-11-14T02:08:23.000Z"
    }
  ]
}
```

### Get User by ID
```
GET /users/:id
```
Returns a specific user.

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "createdAt": "2025-11-14T02:08:23.000Z"
  }
}
```

### Create User
```
POST /users
Content-Type: application/json

{
  "username": "john_doe"
}
```

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "createdAt": "2025-11-14T02:08:23.000Z"
  }
}
```

**Error (409 - Username exists):**
```json
{
  "error": "Username already exists"
}
```

### Update User
```
PUT /users/:id
Content-Type: application/json

{
  "username": "jane_doe"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "jane_doe",
    "createdAt": "2025-11-14T02:08:23.000Z"
  }
}
```

### Delete User
```
DELETE /users/:id
```

**Response:**
```json
{
  "message": "User deleted successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "createdAt": "2025-11-14T02:08:23.000Z"
  }
}
```

## Development

### Run Locally
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
npm start
```

### Docker
```bash
docker-compose up -d user-service
```

## Testing the API

```bash
# Health check
curl http://localhost/api/users/health

# Create a user
curl -X POST http://localhost/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe"}'

# Get all users
curl http://localhost/api/users

# Get user by ID
curl http://localhost/api/users/1

# Update user
curl -X PUT http://localhost/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"username": "jane_doe"}'

# Delete user
curl -X DELETE http://localhost/api/users/1
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)

## Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Fastify 5.2
- **Language:** TypeScript 5.7
- **Build Tool:** tsc (TypeScript Compiler)
- **Dev Tool:** tsx (for hot reload)
