# DM Library data

Authoritative user library for this local app (catalogues, campaign play state, assets).

**Privacy:** committing `/data` versions your personal campaign and catalogue content into Git.
This repository is intended to be private; treat that as intentional backup, not disposable scratch.

Do not store secrets or credentials here.

## Layout

- `catalogues/<type>/<id>.json` — one entry per file
- `campaigns/index.json` — user-created campaign registry
- `campaigns/<id>/*.json` — campaign documents (state, chronicle, edits, …)
- `assets/portraits|maps/<type>/<id>.<ext>` — image binaries
- `.backup/` — last-known-good copies before overwrite (gitignored)
