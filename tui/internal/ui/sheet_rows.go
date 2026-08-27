package ui

import (
	"strings"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/api"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/model"
)

// SheetRowKind classifies a navigable character-sheet row.
type SheetRowKind string

const (
	sheetRowHP       SheetRowKind = "hp"
	sheetRowAC       SheetRowKind = "ac"
	sheetRowInit     SheetRowKind = "init"
	sheetRowCond     SheetRowKind = "cond"
	sheetRowHeader   SheetRowKind = "header"
	sheetRowLink     SheetRowKind = "link"
)

// SheetRow is one selectable row on the interactive character sheet.
type SheetRow struct {
	Kind  SheetRowKind
	Label string
	Value string
	Type  string // catalogue type for links
	ID    string
}

// BuildSheetRows builds navigable rows from a character sheet + live state + entity initiative.
func BuildSheetRows(entry map[string]any, live *api.CharacterState, initiative float64, conditions string) []SheetRow {
	if entry == nil {
		return nil
	}
	var rows []SheetRow
	hpCur, hpMax := entry["hpCurrent"], entry["hpMax"]
	if live != nil {
		if live.HPCurrent != nil {
			hpCur = *live.HPCurrent
		}
		if live.HPMax != nil {
			hpMax = *live.HPMax
		}
	}
	rows = append(rows, SheetRow{Kind: sheetRowHP, Label: "HP", Value: formatHPPair(hpCur, hpMax)})
	rows = append(rows, SheetRow{Kind: sheetRowAC, Label: "AC", Value: anyString(entry["ac"])})
	initVal := "—"
	if initiative != 0 {
		initVal = trimNum(initiative)
	}
	rows = append(rows, SheetRow{Kind: sheetRowInit, Label: "Initiative", Value: initVal})
	cond := conditions
	if cond == "" && live != nil {
		cond = model.ConditionsToText(live.Conditions)
	}
	rows = append(rows, SheetRow{Kind: sheetRowCond, Label: "Conditions", Value: emptyDash(cond)})

	appendLinkSection := func(title string, keys ...string) {
		links := collectSheetLinks(entry, keys...)
		if len(links) == 0 {
			return
		}
		rows = append(rows, SheetRow{Kind: sheetRowHeader, Label: title})
		rows = append(rows, links...)
	}
	appendLinkSection("Skills", "skillRefs", "skills")
	appendLinkSection("Features", "featureRefs", "features", "featuresSpells")
	appendLinkSection("Spells", "spellRefs", "spells")
	appendLinkSection("Inventory", "equipment", "inventory")
	return rows
}

func collectSheetLinks(entry map[string]any, keys ...string) []SheetRow {
	var out []SheetRow
	seen := map[string]bool{}
	for _, key := range keys {
		raw, ok := entry[key]
		if !ok || raw == nil {
			continue
		}
		switch t := raw.(type) {
		case []any:
			for _, item := range t {
				addLinkRow(&out, seen, item)
			}
		case []string:
			for _, item := range t {
				addLinkRow(&out, seen, item)
			}
		case string:
			addLinkRow(&out, seen, t)
		}
	}
	return out
}

func addLinkRow(out *[]SheetRow, seen map[string]bool, item any) {
	var raw string
	switch v := item.(type) {
	case string:
		raw = v
	case map[string]any:
		raw = strField(v, "ref", "id", "name")
		if typ, id, label, ok := ParseCatalogueRef(raw); ok {
			key := typ + ":" + id
			if seen[key] {
				return
			}
			seen[key] = true
			if label == "" {
				label = strField(v, "name", "title")
			}
			if label == "" {
				label = id
			}
			*out = append(*out, SheetRow{Kind: sheetRowLink, Label: label, Type: typ, ID: id})
			return
		}
		if id := strField(v, "id"); id != "" {
			typ := strField(v, "type", "kind")
			if typ == "" {
				typ = "item"
			}
			key := typ + ":" + id
			if seen[key] {
				return
			}
			seen[key] = true
			label := strField(v, "name", "title")
			if label == "" {
				label = id
			}
			*out = append(*out, SheetRow{Kind: sheetRowLink, Label: label, Type: typ, ID: id})
		}
		return
	default:
		return
	}
	typ, id, label, ok := ParseCatalogueRef(raw)
	if !ok {
		// bare label — show but not followable
		if strings.TrimSpace(raw) == "" {
			return
		}
		*out = append(*out, SheetRow{Kind: sheetRowLink, Label: strings.TrimSpace(raw)})
		return
	}
	key := typ + ":" + id
	if seen[key] {
		return
	}
	seen[key] = true
	if label == "" {
		label = id
	}
	*out = append(*out, SheetRow{Kind: sheetRowLink, Label: label, Type: typ, ID: id})
}
