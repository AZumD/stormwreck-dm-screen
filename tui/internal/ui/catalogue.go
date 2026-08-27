package ui

import (
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

// LookupHit is one entry in the master cross-catalogue index.
type LookupHit struct {
	Type  string
	ID    string
	Name  string
	Entry map[string]any
}

// BuildLookupHits flattens catalogue type → entries into searchable hits.
// types is the preferred order (from health); missing types still included.
func BuildLookupHits(types []string, byType map[string][]map[string]any) []LookupHit {
	if len(byType) == 0 {
		return nil
	}
	order := ResolveCatalogueTypes(types)
	seen := map[string]bool{}
	var out []LookupHit
	appendType := func(typ string) {
		if seen[typ] {
			return
		}
		seen[typ] = true
		for _, e := range byType[typ] {
			id := strField(e, "id")
			if id == "" {
				continue
			}
			name := strField(e, "name", "title")
			if name == "" {
				name = id
			}
			out = append(out, LookupHit{Type: typ, ID: id, Name: name, Entry: e})
		}
	}
	for _, t := range order {
		appendType(t)
	}
	for typ := range byType {
		appendType(typ)
	}
	return out
}

// FilterLookupHits filters master-index hits by type title, id, name, summary, tags.
func FilterLookupHits(hits []LookupHit, query string) []LookupHit {
	q := strings.ToLower(strings.TrimSpace(query))
	if q == "" {
		return append([]LookupHit(nil), hits...)
	}
	var out []LookupHit
	for _, h := range hits {
		hay := strings.ToLower(h.Type + " " + CatalogueTypeTitle(h.Type) + " " + h.ID + " " + h.Name)
		if h.Entry != nil {
			hay += " " + EntrySearchText(h.Entry)
		}
		if strings.Contains(hay, q) {
			out = append(out, h)
		}
	}
	return out
}

// LookupHitLabel formats a result row: "Item · Black Rose".
func LookupHitLabel(h LookupHit) string {
	return CatalogueTypeTitle(h.Type) + " · " + h.Name
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
