# Concert Tracker – notes for Claude

Personal app to log concerts attended since 2010 and show statistics. Runs **only locally** on the owner's
CachyOS PC (browser at http://localhost:5173). The owner already codes; explain briefly, don't over-teach.

## Environment
- OS: CachyOS (Arch-based). Install packages with `pacman` (AUR via `paru`). Shell is **fish** – give
  fish-compatible commands (no bash heredocs, no `export VAR=…`; `VAR=value cmd` is fine).
- Node 22+, package manager **pnpm** (installed via `pacman -S pnpm`, not corepack).
- Repo: github.com/matze616/concerTracker, branch `main`.

## Stack
- **SvelteKit 3** + Svelte 5 runes, TypeScript. Config lives in `vite.config.ts` (there is no svelte.config.js).
- `$lib` is removed in SvelteKit 3: import with `#lib/...` **including the file extension**
  (`#lib/server/repo.ts`, `#lib/format.ts`, `#lib/server/db/index.ts`, `#lib/components/X.svelte`).
- SQLite via better-sqlite3 + Drizzle ORM. Tailwind 4, Chart.js, Leaflet + OpenStreetMap tiles,
  Nominatim geocoding (max 1 req/s, see `src/lib/server/geocode.ts`). adapter-node for `pnpm build && pnpm start`.

## Data rules (important)
- The real database is `data/concerts.db` (override with `DATABASE_PATH` in `.env`). It is the owner's personal data.
- **Never commit or push data**: `data/`, `backups/`, `exports/`, `*.db`, `*.sqlite*`, `*.csv`, `.env` are git-ignored,
  and `scripts/check-no-data.mjs` runs as a pre-commit hook (simple-git-hooks) to block them. Don't weaken either.
- Never name a source folder/file `*.csv` (it would be ignored) – that's why export routes are `/export/csv` and `/export/json`.
- Don't modify or delete `data/concerts.db` during development or tests. Use the demo DB (`pnpm db:seed` →
  `data/demo.db`, run with `DATABASE_PATH=data/demo.db pnpm dev`) or the in-memory DB in tests.

## Code map
- `src/lib/server/db/schema.ts` – tables: venues, events, concerts, bands, concert_bands (position, is_headliner),
  people, concert_people. Names are unique case-insensitively (`lower(name)` indexes).
- `src/lib/server/repo.ts` – save/list/delete concerts (find-or-create bands/people/venues/events, orphan cleanup),
  rename/merge for bands, people, events, venues.
- `src/lib/server/stats.ts` – all statistics as plain SQL; tests in `stats.test.ts` (in-memory DB).
- `src/lib/server/concert-form.ts` + `forms.ts` – form state ↔ ConcertInput, validation, save action.
- `src/lib/components/ConcertForm.svelte` – entry form (state serialized into a hidden `payload` JSON field).
- `src/routes/` – overview, concerts (list/new/[id]/edit), bands, venues (map), people, events, export.
- Migrations in `drizzle/` are applied automatically on startup (`openDb`).

## Conventions
- Schema change: edit `schema.ts` → `pnpm db:generate` → **review the SQL** (drizzle-kit mangled the multi-column
  expression index `venues_name_city_uq` once; it was fixed by hand in `0000_init.sql`).
- Prices are stored as integer cents (`ticket_price_cents`), dates as ISO `YYYY-MM-DD` text.
- UI text in English, dates/money formatted with the fixed `en-GB` locale (`src/lib/format.ts`) to avoid hydration mismatches.
- Colors are CSS tokens in `src/app.css` with light + dark values; charts use a single series color (`--series-1`).
- Before committing: `pnpm check` and `pnpm test` must pass.

## Possible next steps discussed
- CSV import, if the owner collects their old data in a spreadsheet.
- Optional systemd user service (see README section 4).
