package actions_test

import (
	"testing"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/actions"
)

func TestEditingSuppressesSingleLetterGlobals(t *testing.T) {
	for _, key := range []string{"h", "i", "c", "l", "s", "a", "q", "1", " ", "+"} {
		if act, ok := actions.Resolve(key, true); ok {
			t.Fatalf("editing should suppress %q, got %s", key, act)
		}
	}
	if act, ok := actions.Resolve("esc", true); !ok || act != actions.AppBack {
		t.Fatalf("esc: got %s %v", act, ok)
	}
	if act, ok := actions.Resolve("enter", true); !ok || act != actions.SelOpen {
		t.Fatalf("enter: got %s %v", act, ok)
	}
	if act, ok := actions.Resolve("ctrl+c", true); !ok || act != actions.Quit {
		t.Fatalf("ctrl+c: got %s %v", act, ok)
	}
	if act, ok := actions.Resolve("ctrl+k", true); !ok || act != actions.AppLookup {
		t.Fatalf("ctrl+k while editing: got %s %v", act, ok)
	}
	if act, ok := actions.Resolve("ctrl+s", true); !ok || act != actions.SceneSave {
		t.Fatalf("ctrl+s while editing: got %s %v", act, ok)
	}
}

func TestAppLookupBinding(t *testing.T) {
	got, ok := actions.Resolve("ctrl+k", false)
	if !ok || got != actions.AppLookup {
		t.Fatalf("got %s %v", got, ok)
	}
}

func TestTabs1to5(t *testing.T) {
	want := map[string]actions.Action{
		"1": actions.CampaignScene,
		"2": actions.CampaignNotes,
		"3": actions.CampaignParty,
		"4": actions.CampaignMap,
		"5": actions.CampaignMusic,
	}
	for k, w := range want {
		got, ok := actions.Resolve(k, false)
		if !ok || got != w {
			t.Fatalf("%s: got %s %v want %s", k, got, ok, w)
		}
	}
}

func TestShiftNQuickNotes(t *testing.T) {
	got, ok := actions.Resolve("shift+n", false)
	if !ok || got != actions.NotesQuick {
		t.Fatalf("got %s %v", got, ok)
	}
}

func TestSceneEditAndSwitch(t *testing.T) {
	got, ok := actions.Resolve("shift+e", false)
	if !ok || got != actions.SceneEdit {
		t.Fatalf("shift+e: %s %v", got, ok)
	}
	got, ok = actions.Resolve("shift+s", false)
	if !ok || got != actions.SceneSwitch {
		t.Fatalf("shift+s: %s %v", got, ok)
	}
}

func TestPaneKeys(t *testing.T) {
	got, ok := actions.Resolve("tab", false)
	if !ok || got != actions.PaneNext {
		t.Fatalf("tab: %s %v", got, ok)
	}
	got, ok = actions.Resolve("shift+tab", false)
	if !ok || got != actions.PanePrev {
		t.Fatalf("shift+tab: %s %v", got, ok)
	}
	got, ok = actions.Resolve("left", false)
	if !ok || got != actions.AdjustDec {
		t.Fatalf("left should AdjustDec, got %s %v", got, ok)
	}
	got, ok = actions.Resolve("right", false)
	if !ok || got != actions.AdjustInc {
		t.Fatalf("right should AdjustInc, got %s %v", got, ok)
	}
}

func TestRefKeys(t *testing.T) {
	got, ok := actions.Resolve("]", false)
	if !ok || got != actions.RefNext {
		t.Fatalf("]: %s %v", got, ok)
	}
	got, ok = actions.Resolve("[", false)
	if !ok || got != actions.RefPrev {
		t.Fatalf("[: %s %v", got, ok)
	}
}

func TestF13(t *testing.T) {
	got, ok := actions.LookupFKey("f13")
	if !ok || got != actions.CampaignScene {
		t.Fatalf("got %s %v", got, ok)
	}
	got, ok = actions.LookupFKey("F16")
	if !ok || got != actions.MusicToggle {
		t.Fatalf("F16: got %s %v", got, ok)
	}
	got, ok = actions.LookupFKey("f15")
	if !ok || got != actions.NotesQuick {
		t.Fatalf("F15: got %s %v", got, ok)
	}
}

func TestCycleSceneStatus(t *testing.T) {
	if actions.CycleSceneStatus("unseen", 1) != "current" {
		t.Fatal()
	}
	if actions.CycleSceneStatus("skipped", 1) != "unseen" {
		t.Fatal()
	}
	if actions.CycleSceneStatus("current", -1) != "unseen" {
		t.Fatal()
	}
}
