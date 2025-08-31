#!/bin/bash

# Migration script for MoonCakeTV
# Usage: ./migrate.sh [up|down|status] [args...]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if docker compose is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

# Navigate to project root (script is now in migrate/ directory)
PROJECT_ROOT="$(dirname "$0")/.."
cd "$PROJECT_ROOT"

# Check if containers are running
if ! docker compose ps | grep -q "Up"; then
    print_warning "Services don't appear to be running. Starting them..."
    docker compose up -d postgres
    print_info "Waiting for PostgreSQL to be ready..."
    sleep 10
fi

# Set the migration command
ACTION=${1:-up}
ROLLBACK_COUNT=${2:-1}

case $ACTION in
    "up")
        print_info "Running database migrations..."
        docker compose -f compose.migrations.yml run --rm --remove-orphans migrate npm run migrate:up
        ;;
    "down")
        if [ -n "$2" ]; then
            print_info "Rolling back $ROLLBACK_COUNT migration(s)..."
            docker compose -f compose.migrations.yml run --rm --remove-orphans migrate npm run migrate:down $ROLLBACK_COUNT
        else
            print_info "Rolling back last migration..."
            docker compose -f compose.migrations.yml run --rm --remove-orphans migrate npm run migrate:down
        fi
        ;;
    "status")
        print_info "Checking migration status..."
        docker compose -f compose.migrations.yml run --rm --remove-orphans migrate npm run migrate:status
        ;;
    *)
        print_error "Unknown action: $ACTION"
        echo "Usage: ./migrate.sh [up|down|status] [count]"
        echo ""
        echo "Examples:"
        echo "  ./migrate.sh up              # Run all pending migrations"
        echo "  ./migrate.sh down            # Rollback last migration"
        echo "  ./migrate.sh down 3          # Rollback last 3 migrations"
        echo "  ./migrate.sh status          # Show migration status"
        echo ""
        echo "Note: Create migrations locally in development, not in production containers!"
        exit 1
        ;;
esac

print_info "Migration operation completed!"
