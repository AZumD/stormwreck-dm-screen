package ui_test

import (
	"strings"
	"testing"

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

func TestFormatInspectorOnlyPresentFields(t *testing.T) {
	out := ui.FormatInspector(map[string]any{
		"id":   "sw-1",
		"name": "Runara",
		"ac":   float64(15),
	}, "npc")
	if !strings.Contains(out, "Runara") || !strings.Contains(out, "ac: 15") {
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
	// FilterCatalogueTypes("storm") matches nothing; campaigns match stormwreck
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

func TestCatalogueTypeTitle(t *testing.T) {
	if ui.CatalogueTypeTitle("item") != "Items" {
		t.Fatal(ui.CatalogueTypeTitle("item"))
	}
}
