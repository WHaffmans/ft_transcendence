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

# Function to generate MariaDB SSL certificates (CA-based)
generate_mariadb_certs() {
    local db_certs_dir="$CERTS_DIR/mariadb"
    
    echo -e "${GREEN}Generating MariaDB SSL certificates...${NC}"
    
    mkdir -p "$db_certs_dir"
    
    # Generate CA
    echo -e "${YELLOW}  Creating CA certificate...${NC}"
    openssl genrsa 2048 > "$db_certs_dir/ca-key.pem" 2>/dev/null
    openssl req -new -x509 -nodes -days 3650 \
        -key "$db_certs_dir/ca-key.pem" \
        -out "$db_certs_dir/ca-cert.pem" \
        -subj "/C=US/ST=State/L=City/O=FT_Transcendence/CN=MariaDB-CA" \
        2>/dev/null
    
    # Generate server certificate
    echo -e "${YELLOW}  Creating server certificate...${NC}"
    openssl req -newkey rsa:2048 -days 3650 -nodes \
        -keyout "$db_certs_dir/server-key.pem" \
        -out "$db_certs_dir/server-req.pem" \
        -subj "/C=US/ST=State/L=City/O=FT_Transcendence/CN=mariadb" \
        2>/dev/null
    openssl x509 -req -in "$db_certs_dir/server-req.pem" \
        -days 3650 -CA "$db_certs_dir/ca-cert.pem" \
        -CAkey "$db_certs_dir/ca-key.pem" -set_serial 01 \
        -out "$db_certs_dir/server-cert.pem" 2>/dev/null
    
    # Generate client certificate
    echo -e "${YELLOW}  Creating client certificate...${NC}"
    openssl req -newkey rsa:2048 -days 3650 -nodes \
        -keyout "$db_certs_dir/client-key.pem" \
        -out "$db_certs_dir/client-req.pem" \
        -subj "/C=US/ST=State/L=City/O=FT_Transcendence/CN=backend-service" \
        2>/dev/null
    openssl x509 -req -in "$db_certs_dir/client-req.pem" \
        -days 3650 -CA "$db_certs_dir/ca-cert.pem" \
        -CAkey "$db_certs_dir/ca-key.pem" -set_serial 02 \
        -out "$db_certs_dir/client-cert.pem" 2>/dev/null
    
    # Cleanup temporary files
    rm -f "$db_certs_dir"/*.req.pem
    
    # Set permissions (need to be readable by mysql user in container)
    chmod 644 "$db_certs_dir"/ca-cert.pem
    chmod 644 "$db_certs_dir"/server-cert.pem
    chmod 644 "$db_certs_dir"/client-cert.pem
    chmod 644 "$db_certs_dir"/ca-key.pem
    chmod 644 "$db_certs_dir"/server-key.pem
    chmod 644 "$db_certs_dir"/client-key.pem
    
    echo -e "${GREEN}✓ MariaDB certificates created${NC}"
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
generate_mariadb_certs

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
