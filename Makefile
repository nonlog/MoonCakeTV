.PHONY: tea vercel dev build d-build d-run

tea:
	git push tea main

vercel:
	git push vercel main

build:
	npm run build

dev:
	npm run dev

d-build:
	docker build -t mooncaketv . --no-cache

d-run:
	@if [ -f .env ]; then \
		docker run -d -p 3333:3000 --env-file .env --name mooncaketv mooncaketv; \
	else \
		docker run -d -p 3333:3000 --name mooncaketv mooncaketv; \
	fi

dc-up:
	docker compose up --pull always -d

dc-down:
	docker compose down

migrate-up:
	./migrate/migrate.sh up

migrate-down:
	./migrate/migrate.sh down

migrate-status:
	./migrate/migrate.sh status