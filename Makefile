all: build up

deps:
	@bash scripts/init-dev.sh

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

rm: down
	docker compose rm -f

re: rm
	docker compose build --no-cache
	docker compose up -d

logs:
	docker compose logs -f

.PHONY: all up down build