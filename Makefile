################################################################################
#                                                                              #
#                          FT_TRANSCENDENCE MAKEFILE                           #
#                                                                              #
################################################################################

.DEFAULT_GOAL := default

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
BLUE := \033[0;34m
CYAN := \033[0;36m
BOLD := \033[1m
RESET := \033[0m

################################################################################
#                            MODE SWITCHING                                    #
################################################################################
# Read mode from .mode file, default to dev
MODE := $(shell cat .mode 2>/dev/null || echo dev)

# Select compose file based on mode
ifeq ($(MODE),prod)
	COMPOSE_FILE := docker-compose.prod.yaml
	MODE_COLOR := $(RED)
else
	COMPOSE_FILE := docker-compose.yaml
	MODE_COLOR := $(GREEN)
endif

set-prod:
	@echo "prod" > .mode
	@printf "$(GREEN)✓$(RESET) Switched to $(RED)production$(RESET) mode\n"

set-dev:
	@echo "dev" > .mode
	@printf "$(GREEN)✓$(RESET) Switched to $(GREEN)development$(RESET) mode\n"

show-mode:
	@printf "$(BLUE)Mode:$(RESET) $(MODE_COLOR)$(MODE)$(RESET) $(BLUE)|$(RESET) $(COMPOSE_FILE)\n"

################################################################################
#                                HELP                                          #
################################################################################

help:
	@printf "$(BOLD)FT_TRANSCENDENCE - Available Commands$(RESET)\n"
	@printf "\n"
	@printf "$(CYAN)Mode Management:$(RESET)\n"
	@printf "  $(GREEN)show-mode$(RESET)        Show current environment mode\n"
	@printf "  $(GREEN)set-dev$(RESET)          Switch to development mode\n"
	@printf "  $(GREEN)set-prod$(RESET)         Switch to production mode\n"
	@printf "\n"
	@printf "$(CYAN)Docker Operations:$(RESET)\n"
	@printf "  $(GREEN)up$(RESET)               Start all services\n"
	@printf "  $(GREEN)down$(RESET)             Stop all services\n"
	@printf "  $(GREEN)build$(RESET)            Build all services\n"
	@printf "  $(GREEN)re$(RESET)               Rebuild services (preserves data)\n"
	@printf "  $(GREEN)reset$(RESET)            $(RED)⚠$(RESET)  Full reset: remove volumes, rebuild everything\n"
	@printf "  $(GREEN)rm$(RESET)               Remove stopped containers\n"
	@printf "\n"
	@printf "$(CYAN)Monitoring:$(RESET)\n"
	@printf "  $(GREEN)ps$(RESET)               Show container status\n"
	@printf "  $(GREEN)health$(RESET)           Show health status of all services\n"
	@printf "  $(GREEN)logs$(RESET)             Tail logs from all services\n"
	@printf "  $(GREEN)logs-frontend$(RESET)    Tail logs from frontend service\n"
	@printf "  $(GREEN)logs-backend$(RESET)     Tail logs from backend service\n"
	@printf "  $(GREEN)logs-game$(RESET)        Tail logs from game service\n"
	@printf "  $(GREEN)logs-gateway$(RESET)     Tail logs from gateway\n"
	@printf "  $(GREEN)logs-db$(RESET)          Tail logs from database\n"
	@printf "\n"
	@printf "$(CYAN)Shell Access:$(RESET)\n"
	@printf "  $(GREEN)shell-frontend$(RESET)   Enter frontend container shell\n"
	@printf "  $(GREEN)shell-backend$(RESET)    Enter backend container shell\n"
	@printf "  $(GREEN)shell-game$(RESET)       Enter game service container shell\n"
	@printf "  $(GREEN)shell-gateway$(RESET)    Enter gateway container shell\n"
	@printf "  $(GREEN)shell-db$(RESET)         Enter database container shell\n"
	@printf "  $(GREEN)db-cli$(RESET)           Connect to MySQL CLI\n"
	@printf "\n"
	@printf "$(CYAN)Database Operations:$(RESET)\n"
	@printf "  $(GREEN)db-dump$(RESET)          Create database backup to dumps/latest.sql\n"
	@printf "  $(GREEN)db-restore$(RESET)       Restore database from dumps/latest.sql\n"
	@printf "  $(GREEN)db-clear-dump$(RESET)    Remove the local database dump file\n"
	@printf "  $(YELLOW)Note:$(RESET) Auto-dump/restore only in production mode\n"
	@printf "\n"
	@printf "$(CYAN)Cleanup:$(RESET)\n"
	@printf "  $(GREEN)clean$(RESET)            Stop and remove containers & volumes\n"
	@printf "  $(GREEN)clean-volumes$(RESET)    $(RED)⚠$(RESET)  Remove all volumes\n"
	@printf "  $(GREEN)clean-networks$(RESET)   Remove project networks\n"
	@printf "  $(GREEN)clean-all$(RESET)        $(RED)⚠$(RESET)  Complete cleanup (volumes + networks)\n"
	@printf "  $(RED)destroy$(RESET)          $(RED)⚠$(RESET)  $(BOLD)NUCLEAR:$(RESET) Remove dev + prod + images\n"
	@printf "\n"
	@printf "$(CYAN)Setup:$(RESET)\n"
	@printf "  $(GREEN)deps$(RESET)             Install development dependencies\n"
	@printf "  $(GREEN)setup-prod-certs$(RESET) Generate production certificates\n"
	@printf "\n"
	@printf "$(BLUE)Current Mode:$(RESET) $(MODE_COLOR)$(MODE)$(RESET)\n"
	@printf "\n"

################################################################################
#                            SETUP & INITIALIZATION                            #
################################################################################

all: build up

deps:
	@bash scripts/init-dev.sh

setup-prod-certs:
	@bash scripts/generate-prod-certs.sh

up: show-mode
	@if [ "$(MODE)" = "prod" ]; then \
		if [ ! -f certs/prod/traefik-cert.pem ] || [ ! -f certs/prod/mariadb/ca-cert.pem ]; then \
			printf "$(YELLOW)⚠$(RESET)  Production certificates not found, generating...\n"; \
			bash scripts/generate-prod-certs.sh; \
		fi; \
	fi
	@printf "$(BLUE)→$(RESET) Starting services...\n"
	@docker compose -f $(COMPOSE_FILE) up -d
	@if [ "$(MODE)" = "prod" ] && [ -f dumps/latest.sql ]; then \
		printf "$(YELLOW)→$(RESET) Production mode: Database dump found, restoring...\n"; \
		bash scripts/db-restore.sh --auto; \
	fi

down: show-mode
	@if [ "$(MODE)" = "prod" ]; then \
		printf "$(YELLOW)→$(RESET) Production mode: Creating database backup...\n"; \
		bash scripts/db-dump.sh || true; \
	fi
	@printf "$(BLUE)→$(RESET) Stopping services...\n"
	@docker compose -f $(COMPOSE_FILE) down --remove-orphans

build: show-mode
	@printf "$(BLUE)→$(RESET) Building services...\n"
	@docker compose -f $(COMPOSE_FILE) build

rm: show-mode
	@docker compose -f $(COMPOSE_FILE) rm -f

re: show-mode
	@printf "$(BLUE)→$(RESET) Rebuilding services (preserving data)...\n"
	@docker compose -f $(COMPOSE_FILE) down --remove-orphans
	@docker compose -f $(COMPOSE_FILE) build --no-cache
	@docker compose -f $(COMPOSE_FILE) up -d --force-recreate
	@if [ "$(MODE)" = "prod" ] && [ -f dumps/latest.sql ]; then \
		printf "$(YELLOW)→$(RESET) Production mode: Database dump found, restoring...\n"; \
		bash scripts/db-restore.sh --auto; \
	fi

reset: show-mode
	@printf "$(RED)⚠$(RESET)  This will remove ALL volumes and networks, then rebuild from scratch!\n"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@printf "$(BLUE)→$(RESET) Cleaning volumes and networks...\n"
	@docker compose -f $(COMPOSE_FILE) down -v --remove-orphans
	@docker network prune -f --filter "label=com.docker.compose.project=ft_transcendence"
	@docker volume prune -f --filter "label=com.docker.compose.project=ft_transcendence"
	@printf "$(BLUE)→$(RESET) Rebuilding from scratch...\n"
	@docker compose -f $(COMPOSE_FILE) build --no-cache
	@docker compose -f $(COMPOSE_FILE) up -d --force-recreate
	@if [ "$(MODE)" = "prod" ] && [ -f dumps/latest.sql ]; then \
		printf "$(YELLOW)→$(RESET) Production mode: Database dump found, restoring...\n"; \
		bash scripts/db-restore.sh --auto; \
	fi
	@printf "$(GREEN)✓$(RESET) Reset complete\n"

################################################################################
#                         MONITORING & HEALTH                                  #
################################################################################

ps: show-mode
	@docker compose -f $(COMPOSE_FILE) ps -a

health: show-mode
	@printf "$(BLUE)Service Health Status:$(RESET)\n"
	@printf "======================\n"
	@docker compose -f $(COMPOSE_FILE) ps --format "table {{.Service}}\t{{.Status}}" | \
		awk 'BEGIN { \
			CYAN="\033[0;36m"; GREEN="\033[0;32m"; YELLOW="\033[1;33m"; \
			RED="\033[0;31m"; BOLD="\033[1m"; RESET="\033[0m"; \
		} \
		NR==1 { print BOLD $$0 RESET; next } \
		{ \
			line = $$0; \
			gsub(/healthy/, GREEN "healthy" RESET, line); \
			gsub(/starting/, YELLOW "starting" RESET, line); \
			gsub(/unhealthy|Exited/, RED "&" RESET, line); \
			match(line, /^[a-z][a-z0-9-]+/); \
			service = substr(line, RSTART, RLENGTH); \
			rest = substr(line, RLENGTH + 1); \
			print CYAN service RESET rest; \
		}'

logs: show-mode
	@docker compose -f $(COMPOSE_FILE) logs -f

logs-frontend: show-mode
	@docker compose -f $(COMPOSE_FILE) logs -f frontend-service

logs-backend: show-mode
	@docker compose -f $(COMPOSE_FILE) logs -f backend-service

logs-game: show-mode
	@docker compose -f $(COMPOSE_FILE) logs -f game-service

logs-gateway: show-mode
	@docker compose -f $(COMPOSE_FILE) logs -f gateway

logs-db: show-mode
	@docker compose -f $(COMPOSE_FILE) logs -f mariadb

################################################################################
#                            SHELL ACCESS                                      #
################################################################################

shell-frontend: show-mode
	@printf "$(BLUE)→$(RESET) Entering frontend-service shell...\n"
	@docker compose -f $(COMPOSE_FILE) exec frontend-service sh

shell-backend: show-mode
	@printf "$(BLUE)→$(RESET) Entering backend-service shell...\n"
	@docker compose -f $(COMPOSE_FILE) exec backend-service sh

shell-game: show-mode
	@printf "$(BLUE)→$(RESET) Entering game-service shell...\n"
	@docker compose -f $(COMPOSE_FILE) exec game-service sh

shell-gateway: show-mode
	@printf "$(BLUE)→$(RESET) Entering gateway shell...\n"
	@docker compose -f $(COMPOSE_FILE) exec gateway sh

shell-db: show-mode
	@printf "$(BLUE)→$(RESET) Entering mariadb shell...\n"
	@docker compose -f $(COMPOSE_FILE) exec mariadb sh

db-cli: show-mode
	@printf "$(BLUE)→$(RESET) Connecting to database...\n"
	@docker compose -f $(COMPOSE_FILE) exec mariadb mysql -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_DATABASE}

################################################################################
#                         DATABASE OPERATIONS                                  #
################################################################################

db-dump: show-mode
	@bash scripts/db-dump.sh

db-restore: show-mode
	@bash scripts/db-restore.sh

db-clear-dump:
	@REMOVED=false; \
	if [ -f dumps/latest.sql ]; then \
		rm -f dumps/latest.sql; \
		printf "$(GREEN)✓$(RESET) Database dump removed\n"; \
		REMOVED=true; \
	fi; \
	if [ -f dumps/avatars.tar.gz ]; then \
		rm -f dumps/avatars.tar.gz; \
		printf "$(GREEN)✓$(RESET) Avatar backup removed\n"; \
		REMOVED=true; \
	fi; \
	if [ "$$REMOVED" = "false" ]; then \
		printf "$(YELLOW)⚠$(RESET)  No dump files found\n"; \
	fi

################################################################################
#                            CLEANUP                                           #
################################################################################

clean: show-mode
	@printf "$(BLUE)→$(RESET) Cleaning up containers and volumes...\n"
	@docker compose -f $(COMPOSE_FILE) down -v --remove-orphans

clean-volumes: show-mode
	@printf "$(RED)⚠$(RESET)  This will remove ALL Docker volumes for this project!\n"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@docker compose -f $(COMPOSE_FILE) down -v
	@printf "$(GREEN)✓$(RESET) Volumes removed\n"

clean-networks: show-mode
	@printf "$(BLUE)→$(RESET) Removing project networks...\n"
	@docker network prune -f --filter "label=com.docker.compose.project=ft_transcendence"

clean-all: show-mode
	@printf "$(RED)⚠$(RESET)  This will remove volumes, networks, and orphaned containers!\n"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@printf "$(BLUE)→$(RESET) Cleaning everything...\n"
	@docker compose -f $(COMPOSE_FILE) down -v --remove-orphans
	@docker network prune -f --filter "label=com.docker.compose.project=ft_transcendence"
	@docker volume prune -f --filter "label=com.docker.compose.project=ft_transcendence"
	@printf "$(GREEN)✓$(RESET) Cleanup complete\n"

destroy:
	@printf "$(RED)⚠$(RESET)  $(BOLD)DESTROY MODE$(RESET)\n"
	@printf "This will remove $(RED)EVERYTHING$(RESET) from both dev and prod:\n"
	@printf "  • All containers (dev + prod)\n"
	@printf "  • All volumes (dev + prod)\n"
	@printf "  • All networks\n"
	@printf "  • All project images\n"
	@printf "\n"
	@read -p "Type 'DESTROY' to confirm: " confirm && [ "$$confirm" = "DESTROY" ] || exit 1
	@printf "\n"
	@printf "$(BLUE)→$(RESET) Destroying development environment...\n"
	@docker compose -f docker-compose.yaml down -v --remove-orphans --rmi all 2>/dev/null || true
	@printf "$(BLUE)→$(RESET) Destroying production environment...\n"
	@docker compose -f docker-compose.prod.yaml down -v --remove-orphans --rmi all 2>/dev/null || true
	@printf "$(BLUE)→$(RESET) Pruning networks...\n"
	@docker network prune -f --filter "label=com.docker.compose.project=ft_transcendence"
	@printf "$(BLUE)→$(RESET) Pruning volumes...\n"
	@docker volume prune -f --filter "label=com.docker.compose.project=ft_transcendence"
	@printf "$(BLUE)→$(RESET) Removing mode file...\n"
	@rm -f .mode
	@printf "\n"
	@printf "$(GREEN)✓$(RESET) Complete destruction finished - all traces removed\n"

.PHONY: help all up down build rm re reset logs clean deps setup-prod-certs set-prod set-dev show-mode \
	ps health logs-frontend logs-backend logs-game logs-gateway logs-db \
	shell-frontend shell-backend shell-game shell-gateway shell-db db-cli \
	db-dump db-restore db-clear-dump \
	clean-volumes clean-networks clean-all destroy default

default:
	@if docker compose -f $(COMPOSE_FILE) ps --format '{{.Names}}' | grep . >/dev/null; then \
		$(MAKE) --no-print-directory health; \
	else \
		$(MAKE) --no-print-directory help; \
	fi