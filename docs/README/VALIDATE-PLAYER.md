# VALIDATE-PLAYER.md

## Purpose
Phase 3B checks for player API authorization boundaries and DTO shaping.

## Run
```bash
node test/validate-player.js
```

Included in `npm test`.

## Coverage
- Unauthenticated player routes → 401
- Campaign membership scoping
- Multi-character control + multi-player campaign
- One user controlling one character
- Mechanical DTO for controlled characters (HP 1/1 fixture)
- Live suites use dedicated test campaign/character/user ids and delete them afterward
- Regression: imported Althariel row is unchanged after live player-state tests
- Private character DTO denied to other players
- State patch allow/deny + whitelist rejection
- Party PCs only / allowed fields only
- Notes CRUD + cross-user/DM isolation
- Restricted catalogue browse/detail; NPC/PC blocked; DM catalogue enum still blocked
- Library attach to controlled characters; uncontrolled/blocked types denied
- Player-safe portraits; unrelated assets fail
- DM document routes 403 for players
- Expired session → 401
- Player shell: no `prompt()`/`confirm()`; in-app note dialog; tab-bar scroll clearance; 44px pills; empty portraits collapse
- Phase 5A: fantasy theme CSS + static `/assets/player/fairy-forest-bg.jpg`; sticky vitals; collapsible sheet sections; inspiration toggle
- Phase 5B: sheet PATCH whitelist; inventory CRUD; portrait PUT; Edit sheet dialog; `hp_max` mutable
- Phase 5C: Library tab; player catalogue list/search; attach APIs; monster/location allowed; npc/pc blocked
