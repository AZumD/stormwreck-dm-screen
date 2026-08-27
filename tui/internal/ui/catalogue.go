package ui

import (
	"fmt"
	"strings"
)

// FallbackCatalogueTypes mirrors server/lib/ids.js CATALOGUE_TYPES when /api/health omits them.
var FallbackCatalogueTypes = []string{
	"pc", "npc", "race", "class", "skill", "feature", "spell", "item", "monster", "location", "music", "source",
}

// CatalogueTypeTitle returns a display title for a catalogue type id.
func CatalogueTypeTitle(typ string) string {
	switch strings.ToLower(strings.TrimSpace(typ)) {
	case "pc":
		return "PCs"
	case "npc":
		return "NPCs"
	case "race":
		return "Races"
	case "class":
		return "Classes"
	case "skill":
		return "Skills"
	case "feature":
		return "Features"
	case "spell":
		return "Spells"
	case "item":
		return "Items"
	case "monster":
		return "Monsters"
	case "location":
		return "Locations"
	case "music":
		return "Music"
	case "source":
		return "Sources"
	default:
		if typ == "" {
			return "Catalogue"
		}
		return strings.ToUpper(typ[:1]) + typ[1:]
	}
}

// ResolveCatalogueTypes prefers health types; falls back to known server order.
func ResolveCatalogueTypes(fromHealth []string) []string {
	if len(fromHealth) == 0 {
		out := make([]string, len(FallbackCatalogueTypes))
		copy(out, FallbackCatalogueTypes)
		return out
	}
	out := make([]string, 0, len(fromHealth))
	for _, t := range fromHealth {
		t = strings.TrimSpace(t)
		if t != "" {
			out = append(out, t)
		}
	}
	if len(out) == 0 {
		return ResolveCatalogueTypes(nil)
	}
	return out
}

// FilterStrings keeps items whose text contains query (case-insensitive). Empty query → all.
func FilterStrings(items []string, query string) []string {
	q := strings.ToLower(strings.TrimSpace(query))
	if q == "" {
		return append([]string(nil), items...)
	}
	var out []string
	for _, s := range items {
		if strings.Contains(strings.ToLower(s), q) {
			out = append(out, s)
		}
	}
	return out
}

// FilterCatalogueTypes filters type ids by id or display title.
func FilterCatalogueTypes(types []string, query string) []string {
	q := strings.ToLower(strings.TrimSpace(query))
	if q == "" {
		return append([]string(nil), types...)
	}
	var out []string
	for _, t := range types {
		title := strings.ToLower(CatalogueTypeTitle(t))
		if strings.Contains(strings.ToLower(t), q) || strings.Contains(title, q) {
			out = append(out, t)
		}
	}
	return out
}

// EntrySearchText builds a lowercase haystack from common catalogue fields.
func EntrySearchText(entry map[string]any) string {
	if entry == nil {
		return ""
	}
	parts := []string{
		strField(entry, "id"),
		strField(entry, "name", "title"),
		strField(entry, "summary", "description", "notes", "tags"),
	}
	if tags, ok := entry["tags"].([]any); ok {
		for _, t := range tags {
			if s, ok := t.(string); ok {
				parts = append(parts, s)
			}
		}
	}
	return strings.ToLower(strings.Join(parts, " "))
}

// FilterCatalogueEntries filters entries by query against name/id/summary/tags.
func FilterCatalogueEntries(entries []map[string]any, query string) []map[string]any {
	q := strings.ToLower(strings.TrimSpace(query))
	if q == "" {
		return append([]map[string]any(nil), entries...)
	}
	var out []map[string]any
	for _, e := range entries {
		if strings.Contains(EntrySearchText(e), q) {
			out = append(out, e)
		}
	}
	return out
}

// FormatInspector renders a compact summary from JSON fields that are actually present.
func FormatInspector(entry map[string]any, typ string) string {
	if entry == nil {
		return "(nothing selected)"
	}
	var b strings.Builder
	name := strField(entry, "name", "title")
	id := strField(entry, "id")
	if name != "" {
		b.WriteString(name)
	} else if id != "" {
		b.WriteString(id)
	} else {
		b.WriteString("(unnamed)")
	}
	if typ != "" {
		b.WriteString(" [")
		b.WriteString(typ)
		b.WriteByte(']')
	}
	b.WriteByte('\n')
	if id != "" {
		b.WriteString("id: ")
		b.WriteString(id)
		b.WriteByte('\n')
	}
	for _, key := range []string{
		"summary", "description", "notes", "ac", "hp", "level", "cr", "type",
		"category", "rarity", "size", "alignment", "speed", "challenge",
	} {
		if v, ok := entry[key]; ok && v != nil {
			switch t := v.(type) {
			case string:
				if strings.TrimSpace(t) == "" {
					continue
				}
				b.WriteString(key)
				b.WriteString(": ")
				b.WriteString(truncate(t, 200))
				b.WriteByte('\n')
			case float64:
				b.WriteString(key)
				b.WriteString(": ")
				b.WriteString(trimNum(t))
				b.WriteByte('\n')
			case bool:
				b.WriteString(key)
				b.WriteString(": ")
				b.WriteString(fmt.Sprintf("%v", t))
				b.WriteByte('\n')
			}
		}
	}
	return strings.TrimRight(b.String(), "\n")
}

// HomeRow is one selectable row on the Home screen.
type HomeRow struct {
	Kind  string // "library" | "campaign"
	ID    string
	Label string
}

// BuildHomeRows builds LIBRARY + CAMPAIGNS sections with optional filter.
func BuildHomeRows(types []string, campaigns []HomeCampaign, query string) []HomeRow {
	types = FilterCatalogueTypes(types, query)
	var rows []HomeRow
	for _, t := range types {
		rows = append(rows, HomeRow{Kind: "library", ID: t, Label: CatalogueTypeTitle(t)})
	}
	q := strings.ToLower(strings.TrimSpace(query))
	for _, c := range campaigns {
		hay := strings.ToLower(c.ID + " " + c.Title)
		if q != "" && !strings.Contains(hay, q) {
			continue
		}
		label := c.Title
		if label == "" {
			label = c.ID
		}
		rows = append(rows, HomeRow{Kind: "campaign", ID: c.ID, Label: label})
	}
	return rows
}

// HomeCampaign is a campaign row for Home listing helpers.
type HomeCampaign struct {
	ID    string
	Title string
}
