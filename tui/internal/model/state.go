package model

import (
	"encoding/json"
	"fmt"
	"math"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

// MapState mirrors campaigns/:id/map-state.json (partial).
type MapState struct {
	ActiveMap         string                     `json:"activeMap"`
	PartyPositions    map[string]PartyPosition   `json:"partyPositions"`
	PinPositions      map[string]json.RawMessage `json:"pinPositions"`
	Tokens            map[string][]Token         `json:"tokens"`
	InitiativeTracker map[string]InitiativeEntry `json:"initiativeTracker"`
}

type PartyPosition struct {
	MapID string  `json:"mapId"`
	X     float64 `json:"x"`
	Y     float64 `json:"y"`
}

type Token struct {
	ID          string   `json:"id"`
	Label       string   `json:"label"`
	Kind        string   `json:"kind"`
	CatalogueID string   `json:"catalogueId"`
	X           float64  `json:"x"`
	Y           float64  `json:"y"`
	Size        float64  `json:"size"`
	Visible     *bool    `json:"visible"`
	HPCurrent   *float64 `json:"hpCurrent"`
	HPMax       *float64 `json:"hpMax"`
	AC          *float64 `json:"ac"`
	Conditions  string   `json:"conditions"`
}

type InitiativeEntry struct {
	Name       string  `json:"name"`
	Initiative float64 `json:"initiative"`
	Kind       string  `json:"kind"`
}

type CampaignState struct {
	Party []PartyRef `json:"party"`
}

type PartyRef struct {
	Type string `json:"type"`
	ID   string `json:"id"`
}

type LocationsDoc struct {
	Version     int      `json:"version"`
	LocationIDs []string `json:"locationIds"`
}

type Grid struct {
	SizeX         float64 `json:"sizeX"`
	SizeY         float64 `json:"sizeY"`
	PixelsPerGrid float64 `json:"pixelsPerGrid"`
}

type MapCalibration struct {
	Kind   string `json:"kind"`
	Grid   *Grid  `json:"grid"`
	Width  float64 `json:"widthPx"`
	Height float64 `json:"heightPx"`
}

// Entity is a normalized row for the tracker table / ASCII map.
type Entity struct {
	Key        string // stable: pc:… / npc:… / tok:…
	Kind       string // pc|npc|monster
	Name       string
	Initiative float64
	HPCurrent  *float64
	HPMax      *float64
	AC         *float64
	PP         *float64 // passive perception when known
	Conditions string
	EditableHP bool
	EditableAC bool
	EditableCond bool
	EditableInit bool
	// Placement
	OnActiveMap bool
	WorldX      float64
	WorldY      float64
	HasWorldPos bool
	PercentPos  bool // partyPositions use %
	// Backing ids
	CharacterID string
	CatalogueID string
	TokenID     string
	MapID       string
}

func ParseMapState(raw json.RawMessage) (MapState, error) {
	var ms MapState
	if len(raw) == 0 || string(raw) == "null" {
		ms.PartyPositions = map[string]PartyPosition{}
		ms.Tokens = map[string][]Token{}
		ms.InitiativeTracker = map[string]InitiativeEntry{}
		return ms, nil
	}
	if err := json.Unmarshal(raw, &ms); err != nil {
		return ms, err
	}
	if ms.PartyPositions == nil {
		ms.PartyPositions = map[string]PartyPosition{}
	}
	if ms.Tokens == nil {
		ms.Tokens = map[string][]Token{}
	}
	if ms.InitiativeTracker == nil {
		ms.InitiativeTracker = map[string]InitiativeEntry{}
	}
	return ms, nil
}

func ParseCampaignState(raw json.RawMessage) (CampaignState, error) {
	var cs CampaignState
	if len(raw) == 0 || string(raw) == "null" {
		return cs, nil
	}
	err := json.Unmarshal(raw, &cs)
	return cs, err
}

func ParseLocations(raw json.RawMessage) (LocationsDoc, error) {
	var loc LocationsDoc
	if len(raw) == 0 || string(raw) == "null" {
		return loc, nil
	}
	err := json.Unmarshal(raw, &loc)
	return loc, err
}

// SortedInitiative returns tracker rows with initiative != 0, highest first.
func SortedInitiative(tracker map[string]InitiativeEntry) []struct {
	Key   string
	Entry InitiativeEntry
} {
	type row struct {
		Key   string
		Entry InitiativeEntry
	}
	out := make([]row, 0, len(tracker))
	for k, e := range tracker {
		if e.Initiative == 0 {
			continue
		}
		out = append(out, row{Key: k, Entry: e})
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Entry.Initiative != out[j].Entry.Initiative {
			return out[i].Entry.Initiative > out[j].Entry.Initiative
		}
		return strings.ToLower(out[i].Entry.Name) < strings.ToLower(out[j].Entry.Name)
	})
	res := make([]struct {
		Key   string
		Entry InitiativeEntry
	}, len(out))
	for i := range out {
		res[i].Key = out[i].Key
		res[i].Entry = out[i].Entry
	}
	return res
}

// InitiativePatch builds a partial map-state PATCH for one combatant key.
// init <= 0 clears the key with null (canonical absent).
func InitiativePatch(key, name, kind string, init float64) map[string]any {
	if init <= 0 {
		return map[string]any{
			"initiativeTracker": map[string]any{key: nil},
		}
	}
	return map[string]any{
		"initiativeTracker": map[string]any{
			key: map[string]any{
				"name":       name,
				"initiative": init,
				"kind":       kind,
			},
		},
	}
}

func TrackerKey(kind, id string) string {
	switch kind {
	case "pc":
		return "pc:" + id
	case "npc":
		return "npc:" + id
	case "monster":
		return "tok:" + id
	default:
		return kind + ":" + id
	}
}

func LocationLinkID(entryID string) string {
	if strings.HasPrefix(entryID, "sw-") {
		return strings.TrimPrefix(entryID, "sw-")
	}
	return entryID
}

func ResolveActiveMap(saved string, linkIDs []string) string {
	set := map[string]struct{}{}
	for _, id := range linkIDs {
		set[id] = struct{}{}
	}
	if saved != "" {
		if _, ok := set[saved]; ok {
			return saved
		}
		// ignore legacy map-* ids
		if !strings.HasPrefix(saved, "map-") {
			link := LocationLinkID(saved)
			if _, ok := set[link]; ok {
				return link
			}
		}
	}
	if len(linkIDs) > 0 {
		return linkIDs[0]
	}
	return saved
}

var hpSlash = regexp.MustCompile(`(?i)^\s*(\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)`)
var hpFirst = regexp.MustCompile(`(\d+(?:\.\d+)?)`)

func ParseHPBlob(raw any) (cur, max *float64) {
	if raw == nil {
		return nil, nil
	}
	switch v := raw.(type) {
	case float64:
		x := v
		return &x, &x
	case json.Number:
		f, err := v.Float64()
		if err == nil {
			return &f, &f
		}
	case string:
		s := strings.TrimSpace(v)
		if s == "" {
			return nil, nil
		}
		if m := hpSlash.FindStringSubmatch(s); m != nil {
			c, _ := strconv.ParseFloat(m[1], 64)
			mx, _ := strconv.ParseFloat(m[2], 64)
			return &c, &mx
		}
		if m := hpFirst.FindStringSubmatch(s); m != nil {
			c, _ := strconv.ParseFloat(m[1], 64)
			return &c, &c
		}
	}
	return nil, nil
}

func ParseAC(raw any) *float64 {
	if raw == nil {
		return nil
	}
	switch v := raw.(type) {
	case float64:
		return &v
	case json.Number:
		f, err := v.Float64()
		if err == nil {
			return &f
		}
	case string:
		if m := hpFirst.FindStringSubmatch(v); m != nil {
			f, _ := strconv.ParseFloat(m[1], 64)
			return &f
		}
	}
	return nil
}

func FormatHP(cur, max *float64) string {
	if cur == nil && max == nil {
		return "—"
	}
	if cur != nil && max != nil {
		return fmt.Sprintf("%s/%s", trimFloat(*cur), trimFloat(*max))
	}
	if cur != nil {
		return trimFloat(*cur)
	}
	return trimFloat(*max)
}

func trimFloat(f float64) string {
	if math.Mod(f, 1) == 0 {
		return strconv.FormatInt(int64(f), 10)
	}
	return strconv.FormatFloat(f, 'f', 1, 64)
}

func ConditionsToText(raw json.RawMessage) string {
	if len(raw) == 0 || string(raw) == "null" {
		return ""
	}
	var arr []string
	if json.Unmarshal(raw, &arr) == nil {
		return strings.Join(arr, ", ")
	}
	var s string
	if json.Unmarshal(raw, &s) == nil {
		return s
	}
	return strings.TrimSpace(string(raw))
}

func TextToConditions(text string) []string {
	parts := regexp.MustCompile(`[,;\n]+`).Split(text, -1)
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

// ApplyHPInput interprets tracker HP edits: "+2"/"-3" delta, "=5" or "5" set current, "5/10" set both.
func ApplyHPInput(cur, max *float64, input string) (newCur, newMax *float64, err error) {
	s := strings.TrimSpace(input)
	if s == "" {
		return nil, nil, fmt.Errorf("empty HP input")
	}
	base := 0.0
	if cur != nil {
		base = *cur
	}
	newMax = max
	if strings.Contains(s, "/") {
		c, m := ParseHPBlob(s)
		if c == nil || m == nil {
			return nil, nil, fmt.Errorf("expected current/max")
		}
		return c, m, nil
	}
	if strings.HasPrefix(s, "=") {
		f, e := strconv.ParseFloat(strings.TrimSpace(s[1:]), 64)
		if e != nil {
			return nil, nil, e
		}
		return &f, newMax, nil
	}
	if strings.HasPrefix(s, "+") || (strings.HasPrefix(s, "-") && len(s) > 1) {
		delta, e := strconv.ParseFloat(s, 64)
		if e != nil {
			return nil, nil, e
		}
		v := base + delta
		return &v, newMax, nil
	}
	f, e := strconv.ParseFloat(s, 64)
	if e != nil {
		return nil, nil, e
	}
	return &f, newMax, nil
}

func SheetAC(sheet json.RawMessage) *float64 {
	if len(sheet) == 0 {
		return nil
	}
	var m map[string]any
	if json.Unmarshal(sheet, &m) != nil {
		return nil
	}
	return ParseAC(m["ac"])
}

// PassivePerception tries common sheet keys; returns nil if unknown (server has no dedicated field).
func PassivePerception(sheet json.RawMessage) *float64 {
	if len(sheet) == 0 {
		return nil
	}
	var m map[string]any
	if json.Unmarshal(sheet, &m) != nil {
		return nil
	}
	for _, key := range []string{"passivePerception", "passive_perception", "pp"} {
		if v := ParseAC(m[key]); v != nil {
			return v
		}
	}
	return nil
}

func FormatNPCHealth(cur, max *float64) string {
	if cur != nil && max != nil {
		return fmt.Sprintf("%s/%s", trimFloat(*cur), trimFloat(*max))
	}
	if max != nil {
		return trimFloat(*max)
	}
	if cur != nil {
		return trimFloat(*cur)
	}
	return ""
}

func TextToConditionsExport(text string) []string {
	return TextToConditions(text)
}
