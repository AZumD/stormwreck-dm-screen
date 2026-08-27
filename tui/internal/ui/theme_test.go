package ui_test

import (
	"strings"
	"testing"
	"unicode/utf8"

	"github.com/charmbracelet/lipgloss"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/ui"
)

func TestWordWrapSwedish(t *testing.T) {
	in := "Ön reser sig ur havet i mörk basalt och brusande skum."
	out := ui.WordWrap(in, 20)
	for _, line := range strings.Split(out, "\n") {
		if lipgloss.Width(line) > 20 {
			t.Fatalf("line too wide %q width=%d", line, lipgloss.Width(line))
		}
	}
	if !strings.Contains(out, "Ön") || !strings.Contains(out, "basalt") {
		t.Fatalf("%s", out)
	}
	if utf8.RuneCountInString(out) < utf8.RuneCountInString(in) {
		// wrapped text should preserve all runes (plus newlines)
	}
	joined := strings.ReplaceAll(out, "\n", " ")
	for _, w := range strings.Fields(in) {
		if !strings.Contains(joined, w) {
			t.Fatalf("missing word %q in %q", w, out)
		}
	}
}

func TestTruncateVisibleANSI(t *testing.T) {
	styled := lipgloss.NewStyle().Foreground(lipgloss.Color("#5AF78E")).Render("Stormwreck")
	got := ui.TruncateVisible(styled, 5)
	if lipgloss.Width(got) > 5 {
		t.Fatalf("width %d for %q", lipgloss.Width(got), got)
	}
}

func TestRenderPaneWidthIncludesBorder(t *testing.T) {
	out := ui.RenderPane("SCENES", "hello", 28, 10, true)
	if w := lipgloss.Width(out); w != 28 {
		t.Fatalf("outer width %d want 28\n%s", w, out)
	}
	if h := lipgloss.Height(out); h != 10 {
		t.Fatalf("outer height %d want 10", h)
	}
	if !strings.Contains(out, "SCENES") {
		t.Fatalf("missing title: %s", out)
	}
}

func TestSceneWorkspaceFitsWidth(t *testing.T) {
	const W, H = 140, 24
	out := ui.RenderSceneWorkspace(W, H, 0, "nav", "body prose", "party")
	if w := lipgloss.Width(out); w > W {
		t.Fatalf("workspace width %d > %d", w, W)
	}
	// Should contain bordered pane titles
	for _, want := range []string{"SCENES", "SCENE", "PARTY"} {
		if !strings.Contains(out, want) {
			t.Fatalf("missing %q in:\n%s", want, out)
		}
	}
}

func TestSceneWorkspaceNarrow(t *testing.T) {
	out := ui.RenderSceneWorkspace(70, 20, 1, "nav", "body", "party")
	if w := lipgloss.Width(out); w > 70 {
		t.Fatalf("narrow width %d", w)
	}
}

func TestHelpHintsStyled(t *testing.T) {
	out := ui.HelpHints([][2]string{{"Tab", "panes"}, {"Enter", "open"}})
	if !strings.Contains(out, "Tab") || !strings.Contains(out, "panes") {
		t.Fatalf("%s", out)
	}
}

func TestHPBar(t *testing.T) {
	full := ui.HPBar(10, 10, 8)
	if lipgloss.Width(full) != 8 {
		t.Fatalf("full width %d", lipgloss.Width(full))
	}
	empty := ui.HPBar(0, 10, 8)
	if lipgloss.Width(empty) != 8 {
		t.Fatalf("empty width %d", lipgloss.Width(empty))
	}
}

func TestScrollWindow(t *testing.T) {
	lines := []string{"a", "b", "c", "d", "e"}
	win, off := ui.ScrollWindow(lines, 2, 2)
	if off != 2 || strings.Join(win, ",") != "c,d" {
		t.Fatalf("%v off=%d", win, off)
	}
	win, off = ui.ScrollWindow(lines, 99, 2)
	if off != 3 || strings.Join(win, ",") != "d,e" {
		t.Fatalf("clamp %v off=%d", win, off)
	}
}

func TestClampScrollOffset(t *testing.T) {
	if ui.ClampScrollOffset(-3, 10, 4) != 0 {
		t.Fatal("neg")
	}
	if ui.ClampScrollOffset(100, 10, 4) != 6 {
		t.Fatal("high")
	}
	if ui.ClampScrollOffset(2, 3, 10) != 0 {
		t.Fatal("short content")
	}
}

func TestEnsureVisibleScroll(t *testing.T) {
	// selected below viewport → scroll down
	if got := ui.EnsureVisibleScroll(0, 9, 5, 12); got != 5 {
		t.Fatalf("below: %d", got)
	}
	// selected above viewport → scroll up
	if got := ui.EnsureVisibleScroll(5, 2, 5, 12); got != 2 {
		t.Fatalf("above: %d", got)
	}
	// already visible → unchanged
	if got := ui.EnsureVisibleScroll(3, 5, 5, 12); got != 3 {
		t.Fatalf("visible: %d", got)
	}
}
