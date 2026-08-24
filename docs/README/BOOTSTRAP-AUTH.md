# BOOTSTRAP-AUTH.mjs

## Purpose
Idempotent local/dev bootstrap of DM and player accounts, campaign memberships, and character controllers. Passwords come from environment variables only.

## Run
```bash
# After migrate + character seed
npm run db:bootstrap:auth
```

## Required env
| Variable | Meaning |
|----------|---------|
| `DATABASE_URL` | Postgres |
| `BOOTSTRAP_DM_EMAIL` | DM login email (normalized trim+lower) |
| `BOOTSTRAP_DM_PASSWORD` | DM password |
| `BOOTSTRAP_PLAYER_EMAIL` | Player login email |
| `BOOTSTRAP_PLAYER_PASSWORD` | Player password |

## Optional env
| Variable | Default | Meaning |
|----------|---------|---------|
| `BOOTSTRAP_DM_NAME` | `DM` | Display name |
| `BOOTSTRAP_PLAYER_NAME` | `Player` | Display name |
| `BOOTSTRAP_CAMPAIGN_ID` | `stormwreck-isle` | Campaign slug |
| `BOOTSTRAP_CHARACTER_IDS` | empty | Comma-separated character ids to attach to the player |

Never commit real bootstrap passwords. See `.env.example`.
