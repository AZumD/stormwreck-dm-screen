package asciimap_test

import (
	"strings"
	"testing"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/asciimap"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/model"
)

func TestWorldToCellClamp(t *testing.T) {
	b := asciimap.Bounds{MinX: 0, MinY: 0, MaxX: 10, MaxY: 10, Width: 20, Height: 10}
	col, row := asciimap.WorldToCell(-5, -5, b)
	if col != 0 || row != 0 {
		t.Fatalf("%d %d", col, row)
	}
	col, row = asciimap.WorldToCell(100, 100, b)
	if col != 19 || row != 9 {
		t.Fatalf("%d %d", col, row)
	}
	col, row = asciimap.WorldToCell(5, 5, b)
	if col != 10 || row != 5 {
		t.Fatalf("%d %d", col, row)
	}
}

func TestProjectPlacesEntities(t *testing.T) {
	ents := []model.Entity{
		{Key: "pc:1", Kind: "pc", Name: "Ada", HasWorldPos: true, OnActiveMap: true, WorldX: 0, WorldY: 0},
		{Key: "tok:1", Kind: "monster", Name: "Zombie", HasWorldPos: true, OnActiveMap: true, WorldX: 9, WorldY: 9},
	}
	view, markers := asciimap.Project(20, 10, 10, 10, ents, "pc:1")
	if len(markers) != 2 {
		t.Fatalf("markers %d", len(markers))
	}
	lines := strings.Split(view, "\n")
	if len(lines) != 10 {
		t.Fatalf("rows %d", len(lines))
	}
	if !strings.Contains(lines[0], "@") {
		t.Fatalf("selected missing on first row: %q", lines[0])
	}
	if !strings.ContainsRune(lines[9], 'Z') && !strings.ContainsRune(lines[9], 'M') {
		// zombie glyph is Z
		t.Fatalf("monster missing on last row: %q", lines[9])
	}
}

func TestClamp(t *testing.T) {
	if asciimap.Clamp(-1, 0, 5) != 0 || asciimap.Clamp(9, 0, 5) != 5 {
		t.Fatal("clamp")
	}
}
