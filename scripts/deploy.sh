#!/bin/bash
#
# Deploy script for Kaixa Jr
# Usage: ./scripts/deploy.sh [environment]
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Environment
ENV=${1:-production}
IMAGE_NAME="kaixa-jr"
CONTAINER_NAME="kaixa-jr"

echo -e "${GREEN}🦊 Kaixa Jr Deploy Script${NC}"
echo "Environment: $ENV"
echo ""

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deploy checks
echo "🔍 Pre-deploy checks..."

# Check if .env exists
if [ ! -f .env ]; then
    log_error ".env file not found!"
    echo "Please create .env from .env.example"
    exit 1
fi

# Validate configuration
log_info "Validating configuration..."
node -e "
const { getConfig } = require('./src/core/config');
const config = getConfig();
const validation = config.validate();
if (!validation.valid) {
    console.error('Invalid configuration:', validation.missing);
    process.exit(1);
}
console.log('Configuration valid');
"

# Run tests
log_info "Running tests..."
npm test

# Build Docker image
log_info "Building Docker image..."
docker build -t $IMAGE_NAME:$ENV .

# Stop existing container
log_info "Stopping existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Run new container
log_info "Starting new container..."
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -v $(pwd)/memory:/app/memory \
    -v $(pwd)/logs:/app/logs \
    -v $(pwd)/backups:/app/backups \
    $IMAGE_NAME:$ENV

# Health check
log_info "Health check..."
sleep 5
if docker ps | grep -q $CONTAINER_NAME; then
    log_info "Container is running"
else
    log_error "Container failed to start"
    docker logs $CONTAINER_NAME
    exit 1
fi

# Cleanup old images
log_info "Cleaning up old images..."
docker image prune -f

echo ""
echo -e "${GREEN}✅ Deploy completed successfully!${NC}"
echo ""
echo "Container: $CONTAINER_NAME"
echo "Image: $IMAGE_NAME:$ENV"
echo ""
echo "Logs: docker logs -f $CONTAINER_NAME"
echo "Status: docker ps | grep $CONTAINER_NAME"
