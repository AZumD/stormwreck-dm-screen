# LANDING.md

## Purpose
DM Library landing page: session gate for DM accounts, then campaigns + catalogues. Served at `/dm/` (root `/` is the DM/Player gate — see `HOME.md`).

## File
`js/landing.js` (loaded from `dm/index.html` after `campaign-registry.js`)

## Auth
| State | UI |
|-------|-----|
| No session (Postgres configured) | `#view-login` email/password → `POST /api/auth/login` |
| Session with DM membership | `#view-library` + Log out |
| Player-only account | Stay on login with error (no DM role) |
| No `DATABASE_URL` (503) | Open library without session (local file mode) |

## Behavior
| Action | Result |
|--------|--------|
| Sign in | Requires at least one `role=dm` membership |
| Page load (signed in) | Lists `CampaignRegistry` entries under Stormwreck |
| **Create new campaign** | Dialog → create registry entry → open sandbox |
| Open user card | Navigates to `campaigns/sandbox/index.html?id=` |
| Log out | Clears session cookie → login view |

## Markup hooks
- `#view-login` / `#dm-login-form` / `#dm-login-error`
- `#view-library` / `#dm-logout` / `#landing-session`
- `#user-campaign-list`
- `#create-campaign-btn`
- `#create-campaign-dialog` / `#create-campaign-form`

## Related
`CampaignRegistry`, `css/landing.css`, `campaigns/sandbox/`, `docs/README/HOME.md`, `docs/README/AUTH.md`
