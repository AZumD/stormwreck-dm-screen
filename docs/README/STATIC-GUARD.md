# STATIC-GUARD.js

## Purpose
Deny static HTTP access to private project paths (`/data`, `/server`, `/.git`, `/source`, `.env*`, other dotfiles). Catalogue/map binaries remain available only via `/api/assets/...`.

## File
`server/lib/static-guard.js`
