# LANDING.md

## Purpose
DM Library landing page: session gate for DM accounts, then campaigns + catalogues. Served at `/dm/` (root `/` is the DM/Player gate — see `HOME.md`).

## File
`js/landing.js` (loaded from `dm/index.html` after `campaign-registry.js`)

## Auth
Uses `/api/health` → `authRequired` plus `/api/auth/me`.

| State | UI |
|-------|-----|
| `authRequired=false` (local default) | Open `#view-library` without forcing login (player cookies do not block) |
| `authRequired=true`, no session | `#view-login` → `POST /api/auth/login` |
| Session with DM membership | `#view-library` + Log out |
| `authRequired=true`, player-only session | Logout, then login with error |
| No `DATABASE_URL` (503) | Open library without session |

## Behavior
| Action | Result |
|--------|--------|
| Sign in | Requires at least one `role=dm` membership |
| Page load (signed in) | Lists `CampaignRegistry` entries under Stormwreck |
| **Create new campaign** | Dialog → create registry entry → open sandbox |
| Open user card | Navigates to `campaigns/sandbox/index.html?id=` |
| Log out | Clears session; returns to login when `AUTH_REQUIRED=1`, else stays on library |

## Markup hooks
- `#view-login` / `#dm-login-form` / `#dm-login-error`
- `#view-library` / `#dm-logout` / `#landing-session`
- `#user-campaign-list`
- `#create-campaign-btn`
- `#create-campaign-dialog` / `#create-campaign-form`

## Related
`CampaignRegistry`, `css/landing.css`, `campaigns/sandbox/`, `docs/README/HOME.md`, `docs/README/AUTH.md`
