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

func TestSceneColumnsTriple(t *testing.T) {
	l, m, r := layout.SceneColumns(150)
	total := l + layout.SceneGutter + m + layout.SceneGutter + r
	if total != 150 {
		t.Fatalf("triple widths+gutters %d+%d+%d+%d+%d = %d", l, layout.SceneGutter, m, layout.SceneGutter, r, total)
	}
	if l == 0 || r == 0 || m <= l || m <= r {
		t.Fatalf("expected mid-dominant panes, got %d %d %d", l, m, r)
	}
}

func TestSceneColumnsNarrow(t *testing.T) {
	l, m, r := layout.SceneColumns(90)
	if l != 0 || r != 0 || m != 90 {
		t.Fatalf("narrow expected mid-only, got %d %d %d", l, m, r)
	}
}

func TestDetectSceneMode(t *testing.T) {
	if layout.DetectSceneMode(150) != layout.SceneModeTriple {
		t.Fatal("150 triple")
	}
	if layout.DetectSceneMode(90) != layout.SceneModeDual {
		t.Fatal("90 dual")
	}
	if layout.DetectSceneMode(60) != layout.SceneModeNarrow {
		t.Fatal("60 narrow")
	}
}
