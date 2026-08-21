.PHONY: install lint typecheck test test-coverage build cruise verify pack clean help

help:
	@echo "ani2mal — make targets"
	@echo "  install         mise install && pnpm install"
	@echo "  lint            biome check"
	@echo "  typecheck       tsc --noEmit"
	@echo "  cruise          domain purity check (no node: imports in src/domain)"
	@echo "  test            vitest run (offline, fixtures only)"
	@echo "  test-coverage   vitest run --coverage"
	@echo "  build           tsup → dist/cli.js"
	@echo "  verify          full-loop gate (lint→typecheck→cruise→test→build→smokes)"
	@echo "  pack            npm pack --dry-run"
	@echo "  clean           rm -rf dist coverage .tmp"

install:
	mise install
	pnpm install

lint:
	pnpm lint

typecheck:
	pnpm typecheck

cruise:
	@! grep -R -E "from ['\"]node:|import.*node:" src/domain 2>/dev/null || (echo "✖ domain imports node:"; exit 1)
	@echo "✓ domain purity ok"

test:
	pnpm test

test-coverage:
	pnpm test:coverage

build:
	pnpm build

verify: lint typecheck cruise test build
	@node dist/cli.js --help >/dev/null && echo "✓ --help exit 0"
	@node dist/cli.js --version >/dev/null && echo "✓ --version exit 0"
	@rm -rf /tmp/ani-verify-out && node dist/cli.js export --username Jimmy123 --out /tmp/ani-verify-out >/dev/null && echo "✓ export Jimmy123 → /tmp/ani-verify-out ($$(ls /tmp/ani-verify-out | wc -l) files)"
	@rm -rf /tmp/ani-verify-out
	@ANI2MAL_CONFIG_DIR=/tmp/ci-test-verify node dist/cli.js sync --dry-run 2>&1 | grep -q "anilist.username" && echo "✓ sync --dry-run no-token → exit 2 actionable" || (echo "✖ sync --dry-run failed"; exit 1)
	@npm pack --dry-run 2>&1 | grep -q "dist/cli.js" && echo "✓ npm pack contains dist"

pack:
	npm pack --dry-run

clean:
	rm -rf dist coverage .tmp/ani2mal-dev /tmp/ani-verify-out /tmp/ci-test-verify
