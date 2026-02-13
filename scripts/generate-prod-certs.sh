#!/bin/bash
set -e

# Certificate generation script for production HTTPS setup
# Generates self-signed certificates for Traefik and all backend services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CERTS_DIR="$PROJECT_ROOT/certs/prod"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Production Certificate Generation ===${NC}"
echo ""

# Create certs directory if it doesn't exist
if [ ! -d "$CERTS_DIR" ]; then
    echo -e "${YELLOW}Creating certs directory: $CERTS_DIR${NC}"
    mkdir -p "$CERTS_DIR"
fi

# Function to generate a certificate
generate_cert() {
    local name=$1
    local cn=$2
    local san=$3
    
    echo -e "${YELLOW}Generating certificate for: $name${NC}"
    
    openssl req -x509 -newkey rsa:4096 \
        -keyout "$CERTS_DIR/${name}-key.pem" \
        -out "$CERTS_DIR/${name}-cert.pem" \
        -days 365 -nodes \
        -subj "/C=US/ST=State/L=City/O=FT_Transcendence/CN=$cn" \
        -addext "subjectAltName=$san" \
        2>/dev/null
    
    chmod 644 "$CERTS_DIR/${name}-cert.pem"
    chmod 600 "$CERTS_DIR/${name}-key.pem"
    
    echo -e "${GREEN}✓ Certificate created: ${name}-cert.pem${NC}"
}

# Generate certificates for each service
echo ""
echo -e "${GREEN}Generating Traefik gateway certificate...${NC}"
generate_cert "traefik" "localhost" "DNS:localhost,DNS:*.localhost,IP:127.0.0.1"

echo ""
echo -e "${GREEN}Generating frontend service certificate...${NC}"
generate_cert "frontend" "frontend-service" "DNS:frontend-service,DNS:localhost,IP:127.0.0.1"

echo ""
echo -e "${GREEN}Generating backend service certificate...${NC}"
generate_cert "backend" "backend-service" "DNS:backend-service,DNS:localhost,IP:127.0.0.1"

echo ""
echo -e "${GREEN}Generating game service certificate...${NC}"
generate_cert "game" "game-service" "DNS:game-service,DNS:localhost,IP:127.0.0.1"

echo ""
echo -e "${GREEN}=== Certificate Generation Complete ===${NC}"
echo ""
echo "Generated certificates in: $CERTS_DIR"
echo ""
echo "Files created:"
ls -lh "$CERTS_DIR" | grep -E '\.(pem)$' | awk '{print "  - " $9 " (" $5 ")"}'
echo ""
echo -e "${YELLOW}Note: These are self-signed certificates for development/testing.${NC}"
echo -e "${YELLOW}For production with a real domain, use Let's Encrypt instead.${NC}"
echo ""
