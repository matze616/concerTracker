# 🎸 Concert Tracker

A small personal app to log every concert you have been to: date, venue, bands (in running order, with headliner),
the people you went with, festival/event, ticket price, rating and notes. It shows statistics such as
how often you saw a band, your most visited venues, concert buddies, concerts per year, spending, a venue map and more.

It runs **locally on your computer** (in the browser at <http://localhost:5173>). All data lives in a single SQLite file
on your disk, and **that file is never committed to Git or pushed to GitHub**.

**Stack:** SvelteKit · TypeScript · SQLite (better-sqlite3 + Drizzle ORM) · Tailwind CSS · Chart.js · Leaflet/OpenStreetMap

---

## 1. Setting up the development environment (CachyOS / Arch)

### 1.1 System packages

```bash
sudo pacman -Syu
```

```bash
sudo pacman -S --needed base-devel git nodejs npm pnpm sqlite github-cli openssh
```

`pnpm` is the package manager this project uses. `base-devel` is needed in case the SQLite driver
has to be compiled. Check the versions (Node must be 22 or newer):

```bash
node --version && pnpm --version
```

### 1.2 Editor

- VS Code: `paru -S visual-studio-code-bin` (or `sudo pacman -S code` for the open-source build)
- Recommended extensions: **Svelte for VS Code**, **Tailwind CSS IntelliSense**, **Prettier**
- Optional, to look at the raw database: `sudo pacman -S sqlitebrowser`

### 1.3 Git identity

```bash
git config --global user.name "Your Name"
```

```bash
git config --global user.email "12345678+yourname@users.noreply.github.com"
```

```bash
git config --global init.defaultBranch main
```

Tip: use the private `…@users.noreply.github.com` address shown at GitHub → Settings → Emails, so your real
email address doesn't end up in commits.

### 1.4 GitHub account and SSH key

1. Create an account on <https://github.com> (if needed) and enable two-factor authentication.
2. Create an SSH key (accept the default path, choose a passphrase):

   ```bash
   ssh-keygen -t ed25519 -C "cachyos-pc"
   ```

3. Log in with the GitHub CLI. Choose *GitHub.com → SSH → ~/.ssh/id_ed25519.pub → Login with a web browser*;
   this also uploads your key:

   ```bash
   gh auth login
   ```

4. Test the connection; GitHub should greet you by your username:

   ```bash
   ssh -T git@github.com
   ```

### 1.5 Get the code

```bash
mkdir -p ~/dev && cd ~/dev
```

```bash
gh repo clone matze616/concerTracker concertracker
```

```bash
cd concertracker
```

### 1.6 First start

```bash
pnpm install
```

```bash
pnpm dev
```

Open <http://localhost:5173>. The database `data/concerts.db` is created automatically on first start.

---

## 2. Everyday use

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the app at <http://localhost:5173> |
| `pnpm backup` | Copy the database to `backups/concerts-<timestamp>.db` |
| `pnpm export` | Write CSV + JSON exports to `exports/` |
| `pnpm db:migrate` | Update the database schema (also happens automatically on start) |
| `pnpm db:seed` | Create a **separate** demo database `data/demo.db` with fictional data |
| `DATABASE_PATH=data/demo.db pnpm dev` | Try the app with the demo data |
| `pnpm test` | Run the tests |
| `pnpm check` | Type-check the code |

**Getting updates:** `git pull`, then `pnpm install`. Schema changes are applied automatically on the next start; your
data is untouched because it is not part of the repository.

### Tips for entering your concerts

- **Venue:** start typing and pick an existing venue. For a new one, enter the name and fill in city/country/address.
  The location is looked up on OpenStreetMap when you save. You can fix it on the venue page (click the map or drag the marker).
- **Bands:** enter them in running order (opener first). Press **Enter** to jump to the next band, drag ⠿ or use ↑/↓ to
  reorder, and tick **Headliner**. If no band is ticked, the last band counts as headliner.
- **People:** type a name and press Enter. Leave empty if you went alone.
- **Festivals:** fill in “Festival / event”. On the concert page, **+ Next day** pre-fills the next festival day.
- **Typos:** on a band or person page, “Rename / merge” fixes names. If the new name already exists, both are merged.
  Duplicate venues can be merged on the venue page.

---

## 3. Your data stays local

- The database is `data/concerts.db` (change it with `DATABASE_PATH` in a `.env` file; see `.env.example`).
- `data/`, `backups/`, `exports/`, all `*.db` / `*.sqlite` / `*.csv` files and `.env` are in `.gitignore`.
- A **pre-commit hook** (installed automatically by `pnpm install`) blocks any commit that contains such files,
  even if you add them with `git add -f`.
- Git is **not** your backup. Run `pnpm backup` regularly and copy the `backups/` folder to another drive or a sync
  folder (e.g. Nextcloud), for example:

  ```bash
  pnpm backup && rsync -a backups/ /run/media/$USER/USB-STICK/concert-backups/
  ```

- To restore, stop the app and copy a backup file over `data/concerts.db`.

### Settings (`.env`)

```bash
cp .env.example .env
```

| Variable | Default | Meaning |
| --- | --- | --- |
| `DATABASE_PATH` | `data/concerts.db` | Where the database lives |
| `GEOCODING` | `on` | Set to `off` to never contact OpenStreetMap |
| `PORT` | `3000` | Port for the production build (`pnpm start`) |

---

## 4. Optional: start automatically

Build once, then run it as a user service:

```bash
pnpm build
```

Create the file `~/.config/systemd/user/concertracker.service` (for example `mkdir -p ~/.config/systemd/user`, then
`code ~/.config/systemd/user/concertracker.service`) with this content:

```ini
[Unit]
Description=Concert Tracker

[Service]
WorkingDirectory=%h/dev/concertracker
ExecStart=/usr/bin/node --env-file-if-exists=.env build
Environment=HOST=127.0.0.1
Restart=on-failure

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now concertracker
```

The app is then always available at <http://localhost:3000>. After `git pull`, run `pnpm install && pnpm build` and
`systemctl --user restart concertracker`.

---

## 5. Project structure

```
src/lib/server/db/schema.ts   database tables (Drizzle)
src/lib/server/repo.ts        saving/loading concerts, rename & merge
src/lib/server/stats.ts       all statistics queries (tested in stats.test.ts)
src/lib/server/geocode.ts     OpenStreetMap lookup (max. 1 request/second)
src/lib/components/           form, charts, map, lists
src/routes/                   pages (overview, concerts, bands, venues, people, festivals, export)
drizzle/                      SQL migrations (schema only, no data)
scripts/                      migrate, seed, backup, export, pre-commit data guard
```

Changing the schema: edit `schema.ts`, run `pnpm db:generate`, review the generated SQL in `drizzle/`, then restart.
