# Stormwreck DM Screen

Personal local DM Library (vanilla HTML/CSS/JS) with **file-backed** persistence.

## Run (normal workflow)

```bash
git clone https://github.com/AZumD/stormwreck-dm-screen.git
cd stormwreck-dm-screen
npm install
npm start
```

Open **http://127.0.0.1:3000**

User data lives under `/data` (human-readable JSON + image assets). Committing `/data` is intentional backup for a private repo.

### Migrating old browser data

1. Start the server (`npm start`)
2. Open the landing page
3. Click **Import browser data**
4. Confirm the report counts
5. Browser `localStorage` / IndexedDB are left untouched

## Tests

```bash
npm test
```

## Architecture

```text
Browser UI  →  LocalApiClient  →  Node /api  →  /data
```

Built-in adventure prose and catalogue seeds stay in source (`js/campaigns/`, `js/catalogue-seeds/`). Play state, edits, catalogues, and assets live in `/data`.
