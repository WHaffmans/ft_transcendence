all: build up

deps:
	@bash scripts/init-dev.sh

setup-prod-certs:
	@bash scripts/generate-prod-certs.sh

prod:
	@if [ ! -f certs/prod/traefik-cert.pem ]; then \
		echo "Production certificates not found, generating..."; \
		bash scripts/generate-prod-certs.sh; \
	fi
	docker compose -f docker-compose.prod.yaml up -d

prod-re:
	docker compose -f docker-compose.prod.yaml down -v --remove-orphans
	@bash scripts/generate-prod-certs.sh
	docker compose -f docker-compose.prod.yaml build --no-cache
	docker compose -f docker-compose.prod.yaml up -d

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

rm: down
	docker compose rm -f

re: clean
	docker compose build --no-cache
	docker compose up -d --force-recreate

logs:
	docker compose logs -f

clean:
	docker compose down -v --remove-orphans

.PHONY: all up down build rm re logs clean deps setup-prod-certs prod prod-re