.PHONY: origin tea vercel dev build

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