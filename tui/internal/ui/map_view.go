package ui

import (
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/asciimap"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/model"
)

func projectASCII(w, h int, snap model.Snapshot, selectedKey string) string {
	out, _ := asciimap.Project(w, h, snap.GridSizeX, snap.GridSizeY, snap.Entities, selectedKey)
	return out
}
