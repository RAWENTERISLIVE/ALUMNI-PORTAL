#!/bin/bash

# Database Migration Helper Script
# Manages database migrations, seeds, and resets

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Alumni Portal - Database Manager   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

if [ $# -eq 0 ]; then
    echo "Usage: ./db.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start      - Start PostgreSQL container"
    echo "  stop       - Stop PostgreSQL container"
    echo "  migrate    - Run pending migrations"
    echo "  seed       - Seed database with initial data"
    echo "  reset      - Reset database (⚠️  DELETES DATA)"
    echo "  logs       - View database logs"
    echo "  backup     - Create database backup"
    echo "  restore    - Restore from backup"
    echo "  status     - Check database status"
    exit 0
fi

case "$1" in
    start)
        echo -e "${YELLOW}Starting database...${NC}"
        make db-start
        echo -e "${GREEN}✓ Database started${NC}"
        ;;
    
    stop)
        echo -e "${YELLOW}Stopping database...${NC}"
        make db-stop
        echo -e "${GREEN}✓ Database stopped${NC}"
        ;;
    
    migrate)
        echo -e "${YELLOW}Running migrations...${NC}"
        make db-migrate
        echo -e "${GREEN}✓ Migrations complete${NC}"
        ;;
    
    seed)
        echo -e "${YELLOW}Seeding database...${NC}"
        make db-seed
        echo -e "${GREEN}✓ Database seeded${NC}"
        ;;
    
    reset)
        echo -e "${RED}⚠️  WARNING: This will DELETE all data!${NC}"
        read -p "Type 'yes' to confirm: " CONFIRM
        if [ "$CONFIRM" = "yes" ]; then
            make db-reset
            echo -e "${GREEN}✓ Database reset${NC}"
        else
            echo -e "${YELLOW}Operation cancelled${NC}"
        fi
        ;;
    
    logs)
        echo -e "${YELLOW}Database logs:${NC}"
        make db-logs
        ;;
    
    backup)
        echo -e "${YELLOW}Creating backup...${NC}"
        BACKUP_FILE="backups/alumni_$(date +%Y%m%d_%H%M%S).sql"
        mkdir -p backups
        docker exec alumni-db pg_dump -U postgres alumni_portal > "$BACKUP_FILE"
        echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}${NC}"
        ;;
    
    restore)
        if [ -z "$2" ]; then
            echo -e "${RED}Usage: ./db.sh restore <backup_file>${NC}"
            ls -lh backups/ 2>/dev/null || echo "No backups found"
            exit 1
        fi
        echo -e "${YELLOW}Restoring from: $2${NC}"
        docker exec -i alumni-db psql -U postgres alumni_portal < "$2"
        echo -e "${GREEN}✓ Restore complete${NC}"
        ;;
    
    status)
        echo -e "${YELLOW}Database Status:${NC}"
        if docker ps | grep -q alumni-db; then
            echo -e "${GREEN}✓ Running${NC}"
            docker exec alumni-db psql -U postgres -c "SELECT version();"
        else
            echo -e "${RED}✗ Not running${NC}"
        fi
        ;;
    
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo "Run: ./db.sh (without args) for help"
        exit 1
        ;;
esac
