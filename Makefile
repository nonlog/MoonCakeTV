.PHONY: origin tea vercel dev build push

origin:
	git push origin main --tags

tea:
	git push tea main --tags

build:
	npm run build

dev:
	npm run dev

push:
	git push origin main --tags && \
	git push tea main --tags