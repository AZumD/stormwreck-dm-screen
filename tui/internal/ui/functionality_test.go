package ui_test

import (
	"testing"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/api"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/ui"
)

func TestNormalizeAndAdjustClock(t *testing.T) {
	c := ui.NormalizeClock(0, -5)
	if c.Day != 1 || c.Minute != 0 {
		t.Fatalf("%+v", c)
	}
	c = ui.AdjustClockMinutes(ui.CampaignClock{Day: 2, Minute: 600}, 10)
	if c.Minute != 610 {
		t.Fatalf("%+v", c)
	}
	c = ui.AdjustClockMinutes(ui.CampaignClock{Day: 2, Minute: 1430}, 20)
	if c.Minute != 1439 {
		t.Fatalf("clamp %+v", c)
	}
	c = ui.AdjustClockDay(ui.CampaignClock{Day: 10, Minute: 100}, 1)
	if c.Day != 10 {
		t.Fatalf("day clamp %+v", c)
	}
	if s := ui.FormatClockCompact(ui.CampaignClock{Day: 2, Minute: 560}); s != "DAY 2 · 09:20" {
		t.Fatalf("%q", s)
	}
	min, err := ui.ParseClockHM("09:20")
	if err != nil || min != 560 {
		t.Fatalf("%d %v", min, err)
	}
}

func TestAdjustInt(t *testing.T) {
	if ui.AdjustInt(8, -1, 0, 10) != 7 {
		t.Fatal()
	}
	if ui.AdjustInt(0, -1, 0, 10) != 0 {
		t.Fatal()
	}
	if ui.AdjustInt(10, 5, 0, 10) != 10 {
		t.Fatal()
	}
}

func TestNextSceneStatus(t *testing.T) {
	if ui.NextSceneStatus("unseen", 1) != "current" {
		t.Fatal()
	}
	if ui.NextSceneStatus("skipped", 1) != "unseen" {
		t.Fatal()
	}
}

func TestFilterSceneSwitcher(t *testing.T) {
	scenes := []api.SceneListItem{
		{ID: "a", Title: "Tarak, första mötet", GroupID: "g1", LocationID: "dragons-rest"},
		{ID: "b", Title: "Shipwreck", GroupID: "g2"},
	}
	groups := []map[string]any{{"id": "g1", "title": "Drakvilan"}}
	got := ui.FilterSceneSwitcher(scenes, groups, "tara")
	if len(got) != 1 || got[0].ID != "a" {
		t.Fatalf("%#v", got)
	}
	got = ui.FilterSceneSwitcher(scenes, groups, "drak")
	if len(got) != 1 || got[0].ID != "a" {
		t.Fatalf("group %#v", got)
	}
	ranked := ui.RankSceneSwitcher(scenes, "b")
	if ranked[0].ID != "b" {
		t.Fatalf("%#v", ranked)
	}
}

func TestBuildSheetRows(t *testing.T) {
	entry := map[string]any{
		"name":      "Althariel",
		"hpCurrent": float64(10),
		"hpMax":     float64(10),
		"ac":        float64(12),
		"equipment": []any{"@item:sw-flint-knife|Flint Knife"},
		"spellRefs": []any{"@spell:druidcraft|Druidcraft"},
	}
	rows := ui.BuildSheetRows(entry, nil, 0, "")
	var hasHP, hasItem, hasSpell bool
	for _, r := range rows {
		if r.Kind == "hp" {
			hasHP = true
		}
		if r.Type == "item" && r.ID == "sw-flint-knife" {
			hasItem = true
		}
		if r.Type == "spell" && r.ID == "druidcraft" {
			hasSpell = true
		}
	}
	if !hasHP || !hasItem || !hasSpell {
		t.Fatalf("%#v", rows)
	}
}
