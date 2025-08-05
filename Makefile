.PHONY: tea dev build d-build d-run

tea:
	git push tea main

build:
	npm run build

dev:
	npm run dev

d-build:
	docker build -t mc-tv . --no-cache

d-run:
	@if [ -f .env ]; then \
		docker run -d -p 3333:3333 --env-file .env --name mooncaketv mooncaketv; \
	else \
		docker run -d -p 3333:3333 --name mooncaketv mooncaketv; \
	fi