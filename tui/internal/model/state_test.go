package model_test

import (
	"encoding/json"
	"testing"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/model"
)

func TestSortedInitiative(t *testing.T) {
	tracker := map[string]model.InitiativeEntry{
		"pc:2":  {Name: "Bob", Initiative: 10, Kind: "pc"},
		"pc:1":  {Name: "Ada", Initiative: 18, Kind: "pc"},
		"npc:x": {Name: "Zero", Initiative: 0, Kind: "npc"},
	}
	rows := model.SortedInitiative(tracker)
	if len(rows) != 2 {
		t.Fatalf("len %d", len(rows))
	}
	if rows[0].Entry.Name != "Ada" || rows[1].Entry.Name != "Bob" {
		t.Fatalf("%v", rows)
	}
}

func TestInitiativePatch(t *testing.T) {
	set := model.InitiativePatch("pc:1", "Ada", "pc", 15)
	tr := set["initiativeTracker"].(map[string]any)
	entry := tr["pc:1"].(map[string]any)
	if entry["initiative"].(float64) != 15 {
		t.Fatalf("%#v", entry)
	}
	clear := model.InitiativePatch("pc:1", "Ada", "pc", 0)
	tr2 := clear["initiativeTracker"].(map[string]any)
	if tr2["pc:1"] != nil {
		t.Fatalf("expected null delete, got %#v", tr2["pc:1"])
	}
}

func TestApplyHPInput(t *testing.T) {
	cur := 8.0
	max := 10.0
	c, m, err := model.ApplyHPInput(&cur, &max, "-3")
	if err != nil || *c != 5 || *m != 10 {
		t.Fatalf("%v %v %v", c, m, err)
	}
	c, m, err = model.ApplyHPInput(&cur, &max, "=2")
	if err != nil || *c != 2 {
		t.Fatalf("%v %v", c, err)
	}
	c, m, err = model.ApplyHPInput(&cur, &max, "3/12")
	if err != nil || *c != 3 || *m != 12 {
		t.Fatalf("%v %v %v", c, m, err)
	}
}

func TestParseMapStateNormalize(t *testing.T) {
	ms, err := model.ParseMapState(json.RawMessage(`{"activeMap":"dragons-rest"}`))
	if err != nil {
		t.Fatal(err)
	}
	if ms.InitiativeTracker == nil || ms.Tokens == nil {
		t.Fatal("expected empty maps")
	}
}

func TestResolveActiveMapIgnoresLegacy(t *testing.T) {
	got := model.ResolveActiveMap("map-legacy", []string{"dragons-rest", "seagrow-caves"})
	if got != "dragons-rest" {
		t.Fatalf("got %q", got)
	}
	got = model.ResolveActiveMap("dragons-rest", []string{"dragons-rest", "seagrow-caves"})
	if got != "dragons-rest" {
		t.Fatalf("got %q", got)
	}
}
