SERVICE_FOLDER = services/
SERVICES = frontend svelte-app user-service

all: build up

deps:
	@for service in $(SERVICES); do \
		cd $(SERVICE_FOLDER)/$$service && \
		echo "Installing dependencies for $$service" && \
		npm install && \
		cd -; \
	done

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