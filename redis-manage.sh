#!/bin/bash
# Redis Management Script

set -e

DOCKER_COMPOSE_FILE="docker-compose.yml"
CONTAINER_NAME="sistema-narracao-redis"
NETWORK_NAME="narracao_network"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
show_help() {
    echo "Redis Management Script"
    echo ""
    echo "Usage: ./redis-manage.sh [command]"
    echo ""
    echo "Commands:"
    echo "  up           - Start Redis container"
    echo "  down         - Stop Redis container"
    echo "  restart      - Restart Redis container"
    echo "  status       - Check Redis status"
    echo "  logs         - View Redis logs"
    echo "  cli          - Connect to Redis CLI"
    echo "  flush        - Flush all Redis data (WARNING!)"
    echo "  backup       - Backup Redis data"
    echo "  info         - Show Redis info"
    echo "  help         - Show this help message"
    echo ""
}

up() {
    echo -e "${BLUE}Starting Redis container...${NC}"
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    echo -e "${GREEN}✅ Redis started successfully${NC}"
    sleep 2
    status
}

down() {
    echo -e "${BLUE}Stopping Redis container...${NC}"
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    echo -e "${GREEN}✅ Redis stopped${NC}"
}

restart() {
    echo -e "${BLUE}Restarting Redis container...${NC}"
    down
    sleep 1
    up
}

status() {
    echo -e "${BLUE}Redis Status:${NC}"
    if docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}" | grep -q "$CONTAINER_NAME"; then
        echo -e "${GREEN}✅ Running${NC}"
        docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    else
        echo -e "${RED}❌ Not running${NC}"
    fi
}

logs() {
    echo -e "${BLUE}Redis Logs:${NC}"
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f
}

cli() {
    echo -e "${BLUE}Connecting to Redis CLI...${NC}"
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec redis redis-cli
}

info() {
    echo -e "${BLUE}Redis Information:${NC}"
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec redis redis-cli info
}

flush() {
    echo -e "${YELLOW}WARNING: This will delete ALL Redis data!${NC}"
    read -p "Type 'yes' to continue: " confirm
    if [ "$confirm" = "yes" ]; then
        echo -e "${BLUE}Flushing Redis...${NC}"
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec redis redis-cli FLUSHALL
        echo -e "${GREEN}✅ All data flushed${NC}"
    else
        echo "Cancelled"
    fi
}

backup() {
    BACKUP_DIR="./redis_backups"
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/redis_backup_$TIMESTAMP.rdb"
    
    echo -e "${BLUE}Creating Redis backup...${NC}"
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli BGSAVE
    sleep 2
    
    if docker cp "$CONTAINER_NAME:/data/dump.rdb" "$BACKUP_FILE"; then
        echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
    else
        echo -e "${RED}❌ Backup failed${NC}"
    fi
}

# Main script
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

case "$1" in
    up)
        up
        ;;
    down)
        down
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    cli)
        cli
        ;;
    info)
        info
        ;;
    flush)
        flush
        ;;
    backup)
        backup
        ;;
    help)
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
