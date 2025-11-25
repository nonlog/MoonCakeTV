.PHONY: origin tea vercel dev build push

origin:
	git push origin main && \
	git push origin --tags

tea:
	git push tea main && \
	git push tea --tags

build:
	npm run build

dev:
	npm run dev

push:
	git push origin main && \
	git push origin --tags && \
	git push tea main && \
	git push tea --tags