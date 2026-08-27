package scene_test

import (
	"strings"
	"testing"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/scene"
)

func TestFlattenRefs(t *testing.T) {
	refs := scene.FlattenRefs([]scene.Block{
		{Type: "text", Refs: []scene.Ref{{Type: "npc", ID: "a", Label: "A"}}},
		{
			Type: "collapse",
			Blocks: []scene.Block{
				{Type: "text", Refs: []scene.Ref{{Type: "npc", ID: "a"}, {Type: "item", ID: "b"}}},
			},
		},
	})
	if len(refs) != 2 || refs[0].ID != "a" || refs[1].ID != "b" {
		t.Fatalf("%#v", refs)
	}
}

func TestFormatBlocksLabels(t *testing.T) {
	out := scene.FormatBlocks([]scene.Block{
		{Type: "text", Text: "Intro prose."},
		{Type: "read-aloud", Text: "The waves crash."},
		{Type: "dm-note", Text: "Secret clue."},
		{
			Type:  "collapse",
			Title: "Treasure",
			Blocks: []scene.Block{
				{Type: "text", Text: "10 gp"},
			},
		},
	})
	for _, want := range []string{
		"Intro prose.",
		"READ ALOUD",
		"The waves crash.",
		"DM NOTE",
		"Secret clue.",
		"Treasure",
		"10 gp",
	} {
		if !strings.Contains(out, want) {
			t.Fatalf("missing %q in:\n%s", want, out)
		}
	}
}

func TestDisplayTextHidesRawRefs(t *testing.T) {
	in := "See @location:stormwreck-isle|Stormwreck Isle on the horizon."
	out := scene.DisplayText(in)
	if strings.Contains(out, "@location") || strings.Contains(out, "stormwreck-isle|") {
		t.Fatalf("raw ref leaked: %s", out)
	}
	if !strings.Contains(out, "Stormwreck Isle") {
		t.Fatalf("%s", out)
	}
}

func TestFormatBlocksUsesLabels(t *testing.T) {
	out := scene.FormatBlocks([]scene.Block{
		{Type: "text", Text: "Walk to @location:dragons-rest|Drakvilan."},
	})
	if strings.Contains(out, "@location") {
		t.Fatalf("raw syntax: %s", out)
	}
	if !strings.Contains(out, "Drakvilan") {
		t.Fatalf("%s", out)
	}
}

