package ui_test

import (
	"strings"
	"testing"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/api"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/ui"
)

func TestFilterCatalogueTypes(t *testing.T) {
	types := []string{"item", "monster", "npc"}
	got := ui.FilterCatalogueTypes(types, "mon")
	if len(got) != 1 || got[0] != "monster" {
		t.Fatalf("%v", got)
	}
	got = ui.FilterCatalogueTypes(types, "items")
	if len(got) != 1 || got[0] != "item" {
		t.Fatalf("title filter %v", got)
	}
}

func TestFilterCatalogueEntries(t *testing.T) {
	entries := []map[string]any{
		{"id": "a", "name": "Black Rose", "summary": "herb"},
		{"id": "b", "name": "Sword", "tags": []any{"weapon"}},
	}
	got := ui.FilterCatalogueEntries(entries, "rose")
	if len(got) != 1 || got[0]["id"] != "a" {
		t.Fatalf("%v", got)
	}
	got = ui.FilterCatalogueEntries(entries, "weapon")
	if len(got) != 1 || got[0]["id"] != "b" {
		t.Fatalf("%v", got)
	}
	got = ui.FilterCatalogueEntries(entries, "")
	if len(got) != 2 {
		t.Fatalf("empty query %d", len(got))
	}
}

func TestFormatInspectorNPC(t *testing.T) {
	out := ui.FormatInspector(map[string]any{
		"id":   "sw-1",
		"name": "Runara",
		"ac":   float64(15),
	}, "npc")
	if !strings.Contains(out, "Runara") || !strings.Contains(out, "AC 15") {
		t.Fatalf("%s", out)
	}
	if strings.Contains(out, "hp:") || strings.Contains(out, "summary:") {
		t.Fatalf("invented fields: %s", out)
	}
}

func TestBuildHomeRowsFilter(t *testing.T) {
	rows := ui.BuildHomeRows(
		[]string{"item", "monster"},
		[]ui.HomeCampaign{{ID: "stormwreck-isle", Title: "Stormwreck"}, {ID: "sandbox", Title: "Sandbox"}},
		"storm",
	)
	var camps, libs int
	for _, r := range rows {
		if r.Kind == "campaign" {
			camps++
		}
		if r.Kind == "library" {
			libs++
		}
	}
	if camps != 1 || libs != 0 {
		t.Fatalf("rows %#v", rows)
	}
}

func TestResolveCatalogueTypesFallback(t *testing.T) {
	got := ui.ResolveCatalogueTypes(nil)
	if len(got) < 5 || got[0] != "pc" {
		t.Fatalf("%v", got)
	}
}

func TestMergeHomeCampaignsAddsBuiltin(t *testing.T) {
	got := ui.MergeHomeCampaigns(nil, nil)
	if len(got) != 1 || got[0].ID != "stormwreck-isle" {
		t.Fatalf("%#v", got)
	}
	got = ui.MergeHomeCampaigns([]api.Campaign{{ID: "sandbox", Title: "Sandbox"}}, []api.Membership{
		{CampaignID: "extra", Role: "dm"},
		{CampaignID: "player-only", Role: "player"},
	})
	ids := map[string]bool{}
	for _, c := range got {
		ids[c.ID] = true
	}
	if !ids["stormwreck-isle"] || !ids["sandbox"] || !ids["extra"] {
		t.Fatalf("missing expected: %#v", got)
	}
	if ids["player-only"] {
		t.Fatalf("should not include player membership: %#v", got)
	}
}

func TestFormatPCSheet(t *testing.T) {
	out := ui.FormatPCSheet(map[string]any{
		"name":             "Althariel",
		"race":             "Skogsalv",
		"class":            "Druid",
		"level":            float64(1),
		"ac":               float64(10),
		"hpCurrent":        float64(10),
		"hpMax":            float64(10),
		"str":              float64(12),
		"dex":              float64(14),
		"wis":              float64(16),
		"equipment":        []any{"@item:sw-flint-knife|Flintadolk"},
		"skillRefs":        []any{"@skill:skill-perception|Perception"},
	}, nil)
	for _, want := range []string{"ALTHARIEL", "Skogsalv", "Druid", "HP 10/10", "AC 10", "STR 12", "Flintadolk", "Perception"} {
		if !strings.Contains(out, want) {
			t.Fatalf("missing %q in:\n%s", want, out)
		}
	}
}

func TestFormatSourceDetailChapters(t *testing.T) {
	out := ui.FormatSourceDetail(map[string]any{
		"name":     "Dragons of Stormwreck Isle",
		"category": "Adventures",
		"chapters": []any{
			map[string]any{
				"title":   "Chapter 1",
				"content": "Welcome to the isle.\n{{read-aloud}}\nSpeak this.\n{{/read-aloud}}",
				"subchapters": []any{
					map[string]any{"title": "Cloister", "content": "Quiet halls."},
				},
			},
		},
	})
	for _, want := range []string{"Dragons of Stormwreck Isle", "Adventures", "Chapter 1", "Welcome to the isle", "READ ALOUD", "Speak this", "Cloister", "Quiet halls"} {
		if !strings.Contains(out, want) {
			t.Fatalf("missing %q in:\n%s", want, out)
		}
	}
}

func TestParseCatalogueRef(t *testing.T) {
	typ, id, label, ok := ui.ParseCatalogueRef("@item:sw-flint-knife|Flintadolk")
	if !ok || typ != "item" || id != "sw-flint-knife" || label != "Flintadolk" {
		t.Fatalf("%s %s %s %v", typ, id, label, ok)
	}
}

func TestFilterSceneItems(t *testing.T) {
	scenes := []api.SceneListItem{
		{ID: "a", Title: "Tarak, first meeting"},
		{ID: "b", Title: "Dragon's Rest"},
		{ID: "c", Title: "Shipwreck"},
	}
	got := ui.FilterSceneItems(scenes, "dragon")
	if len(got) != 1 || got[0].ID != "b" {
		t.Fatalf("%#v", got)
	}
	got = ui.FilterSceneItems(scenes, "")
	if len(got) != 3 {
		t.Fatalf("%d", len(got))
	}
}
