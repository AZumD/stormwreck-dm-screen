# LANDING.md

## Purpose
DM Library landing page: session gate for DM accounts, then campaigns + catalogues + schedule. Served at `/dm/` (root `/` is the DM/Player gate — see `HOME.md`).

## File
`js/landing.js` (loaded from `dm/index.html` after registry + player scheduling scripts)

## Auth
Uses `/api/health` → `authRequired` plus `/api/auth/me`.

| State | UI |
|-------|-----|
| `authRequired=false` (local default) | Open `#view-library` without forcing login (player cookies do not block) |
| `authRequired=true`, no session | `#view-login` → `POST /api/auth/login` |
| Session with DM membership | `#view-library` + Log out + **Player app** link |
| `authRequired=true`, player-only session | Logout, then login with error |
| No `DATABASE_URL` (503) | Open library without session |

## Layout
- Wallpaper: `/assets/dm/dmwallpaper.jpg` behind `.landing-atmosphere`
- Desktop: catalogues sidebar + **Campaigns | Schedule** two-column main grid (`landing-main-grid`)
- ≤1100px: schedule stacks under campaigns; ≤820px: single column (sidebar above)

## Schedule
Reuses `PlayerSchedulingUI.renderHomeSchedule` into `#dm-schedule-list` (availability + global events + upcoming). Requires signed-in session.

## Behavior
| Action | Result |
|--------|--------|
| Sign in | Requires at least one `role=dm` membership |
| **Player app** | Navigates to `/player/` |
| Page load (signed in) | Lists `CampaignRegistry` entries under Stormwreck + renders schedule |
| **Create new campaign** | Dialog → create registry entry → open sandbox |
| Open user card | Navigates to `campaigns/sandbox/index.html?id=` |
| Log out | Clears session; returns to login when `AUTH_REQUIRED=1`, else stays on library |

## Markup hooks
- `#view-login` / `#dm-login-form` / `#dm-login-error`
- `#view-library` / `#dm-logout` / `#landing-session` / `#dm-to-player`
- `#user-campaign-list` / `#dm-schedule-list`
- `#create-campaign-btn` / `#create-campaign-dialog`

## Related
`CampaignRegistry`, `css/landing.css`, `js/player-scheduling.js`, `campaigns/sandbox/`, `docs/README/HOME.md`, `docs/README/AUTH.md`, `docs/README/PLAYER.md`
