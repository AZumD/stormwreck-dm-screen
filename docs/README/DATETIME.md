# DATETIME.js

## Purpose
Calendar date and time parsing for platform scheduling (not in-world campaign clock).

## File
`server/lib/datetime.js`

## Exports
`parseCalendarDate`, `parseOptionalTime`, `parseIsoTimestamp`, `assertUuid`, `addDays`, `formatTimeLabel`

Availability uses `YYYY-MM-DD` strings mapped to SQL `date`. Events use ISO timestamps → `timestamptz`.
