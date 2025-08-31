.PHONY: origin tea vercel dev build d-build d-run


origin:
	git push origin main && \
	git push origin --tags

tea:
	git push tea main && \
	git push tea --tags

vercel:
	git push vercel main && \
	git push vercel --tags

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

m-up:
	./migrate/migrate.sh up

m-down:
	./migrate/migrate.sh down

m-status:
	./migrate/migrate.sh status