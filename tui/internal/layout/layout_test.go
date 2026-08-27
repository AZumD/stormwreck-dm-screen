package layout_test

import (
	"testing"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/layout"
)

func TestDetectMode(t *testing.T) {
	if layout.Detect(99) != layout.ModeNarrow {
		t.Fatal("99 should be narrow")
	}
	if layout.Detect(100) != layout.ModeWide {
		t.Fatal("100 should be wide")
	}
}

func TestPaneSizesWide(t *testing.T) {
	mainW, inspW, mainH, inspH := layout.PaneSizes(120, 40)
	if mainW+inspW != 120 {
		t.Fatalf("widths %d+%d", mainW, inspW)
	}
	if mainH != 40 || inspH != 40 {
		t.Fatalf("heights %d %d", mainH, inspH)
	}
	if inspW >= mainW {
		t.Fatalf("inspector should be smaller side pane: %d %d", mainW, inspW)
	}
}

func TestPaneSizesNarrow(t *testing.T) {
	mainW, inspW, mainH, inspH := layout.PaneSizes(80, 50)
	if mainW != 80 || inspW != 80 {
		t.Fatalf("widths %d %d", mainW, inspW)
	}
	if mainH+inspH != 50 {
		t.Fatalf("heights %d+%d", mainH, inspH)
	}
	if inspH >= mainH {
		t.Fatalf("inspector should be smaller stacked pane: %d %d", mainH, inspH)
	}
}
