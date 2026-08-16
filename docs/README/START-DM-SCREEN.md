# START-DM-SCREEN.bat

## Purpose
Double-click Windows launcher for the local DM Library server.

## File
`start-dm-screen.bat` (project root)

## Behavior
- Changes to the project root (works from any working directory / shortcut)
- Locates `node.exe` via `PATH`, then common install paths, then Cursor’s bundled helper
- If `http://127.0.0.1:3000/` already answers, opens the browser and exits
- Otherwise starts `server/index.js`, opens the browser after ~1s, and keeps the console open until you stop the server (close window or Ctrl+C)

## Usage
Double-click `start-dm-screen.bat`, or from a terminal:

```bat
start-dm-screen.bat
```

Optional: create a desktop / taskbar shortcut to that file.

## Equivalent
`npm start` then open `http://127.0.0.1:3000` (no `npm install` required — zero dependencies).
