# ani2mal — AniList → MyAnimeList Sync

> AniList is the source of truth, MAL is the mirror.

`ani2mal` mirrors your AniList anime and manga lists to MyAnimeList. One direction, no magic, fully previewable.

## Install

```bash
npm install -g ani2mal
# or one-shot
npx ani2mal --help
```

Requires Node 22 or newer (Node 24 LTS recommended).

## Quick start

```bash
# Export without any MAL account — produces MAL-importer XML
npx ani2mal export --username Jimmy123 --out ./mal-import

# Sync (needs MAL OAuth once)
ani2mal config set anilist.username=Jimmy123 mal.clientId=YOUR_CLIENT_ID
ani2mal login
ani2mal sync --dry-run --json | jq .
ani2mal sync
```

## Commands

```
ani2mal config get            Print resolved config (secrets redacted)
ani2mal config set <k=v>...   Set anilist.username | mal.clientId | mal.clientSecret
ani2mal config path           Print config directory
ani2mal login [--no-open]     MAL OAuth (PKCE S256)
ani2mal logout                Delete token + pkce files
ani2mal export --username <name> --out <dir> [--mal-username <n>] [--type a|m|both] [--force]
ani2mal sync [--prune] [--dry-run] [--limit <n>] [--only a|m]
ani2mal watch --interval <time> [sync flags]
ani2mal exclude list|add|rm <id>...
```

Global options: `--config-dir <path>` `--json` `--quiet` `--verbose` `--non-interactive`

## Fresh install (no migration from 2.x)

`ani2mal` 3.0 is a new product. If you used 2.x, install 3.0 fresh and re-run:

```bash
ani2mal config set anilist.username=... mal.clientId=... mal.clientSecret=...
ani2mal login
```

No config file is migrated — 3.0 starts clean by design.

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success, no-op, cancelled, --help/--version |
| 2 | Usage, config, auth |
| 3 | Network / API failure after retries |
| 10 | Partial sync — some writes failed |

## License

MIT
