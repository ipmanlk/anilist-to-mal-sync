## What
<!-- short description of the change -->

## How verified
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green
- [ ] `node dist/cli.js --help` exits 0
- [ ] No `any` / `!` in `src/` (Biome)
- [ ] No `TODO`/`Phase N`/ticket refs in comments

## Guardrails
- Domain remains pure (no `node:*` in `src/domain`)
- No `process.exit()` outside `src/cli/index.ts`
- Signals threaded only to IO, never to pure functions
