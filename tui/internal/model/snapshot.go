package model

import (
	"strings"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/api"
)

// Snapshot is the normalized table the UI renders (derived from server docs only).
type Snapshot struct {
	CampaignID   string
	ActiveMap    string
	MapTitle     string
	GridSizeX    float64
	GridSizeY    float64
	HasGrid      bool
	Entities     []Entity
	Connection   string
	FetchedAtMsg string
}

type BuildInput struct {
	CampaignID  string
	MapState    MapState
	Campaign    CampaignState
	Locations   LocationsDoc
	LocationCat []map[string]any
	Characters  []api.CharacterListItem
	CharSheets  map[string]*api.Character     // characterId -> character
	CharStates  map[string]*api.CharacterState // characterId -> state
	NPCByID     map[string]map[string]any
}

func BuildSnapshot(in BuildInput) Snapshot {
	linkIDs := make([]string, 0)
	titleByLink := map[string]string{}
	gridByLink := map[string]*Grid{}
	catIDByLink := map[string]string{}

	allowed := map[string]struct{}{}
	for _, id := range in.Locations.LocationIDs {
		allowed[id] = struct{}{}
		allowed[LocationLinkID(id)] = struct{}{}
	}

	for _, entry := range in.LocationCat {
		id, _ := entry["id"].(string)
		if id == "" {
			continue
		}
		link := LocationLinkID(id)
		if len(allowed) > 0 {
			if _, ok := allowed[id]; !ok {
				if _, ok2 := allowed[link]; !ok2 {
					continue
				}
			}
		}
		linkIDs = append(linkIDs, link)
		name, _ := entry["name"].(string)
		titleByLink[link] = name
		catIDByLink[link] = id
		if calRaw, ok := entry["mapCalibration"]; ok && calRaw != nil {
			if calMap, ok := calRaw.(map[string]any); ok {
				if gRaw, ok := calMap["grid"].(map[string]any); ok {
					g := &Grid{}
					if v, ok := gRaw["sizeX"].(float64); ok {
						g.SizeX = v
					}
					if v, ok := gRaw["sizeY"].(float64); ok {
						g.SizeY = v
					}
					gridByLink[link] = g
				}
			}
		}
	}

	active := ResolveActiveMap(in.MapState.ActiveMap, linkIDs)
	snap := Snapshot{
		CampaignID: in.CampaignID,
		ActiveMap:  active,
		MapTitle:   titleByLink[active],
	}
	if g := gridByLink[active]; g != nil && g.SizeX > 0 && g.SizeY > 0 {
		snap.HasGrid = true
		snap.GridSizeX = g.SizeX
		snap.GridSizeY = g.SizeY
	}

	byKey := map[string]*Entity{}

	// Characters from Postgres list
	charByCat := map[string]api.CharacterListItem{}
	charByID := map[string]api.CharacterListItem{}
	for _, ch := range in.Characters {
		charByID[ch.ID] = ch
		if ch.CataloguePCID != nil && *ch.CataloguePCID != "" {
			charByCat[*ch.CataloguePCID] = ch
		}
	}

	addOrMerge := func(e Entity) {
		if prev, ok := byKey[e.Key]; ok {
			if e.Name != "" {
				prev.Name = e.Name
			}
			if e.Initiative != 0 {
				prev.Initiative = e.Initiative
			}
			if e.HPCurrent != nil {
				prev.HPCurrent = e.HPCurrent
			}
			if e.HPMax != nil {
				prev.HPMax = e.HPMax
			}
			if e.AC != nil {
				prev.AC = e.AC
			}
			if e.PP != nil {
				prev.PP = e.PP
			}
			if e.Conditions != "" {
				prev.Conditions = e.Conditions
			}
			if e.HasWorldPos {
				prev.HasWorldPos = true
				prev.WorldX, prev.WorldY = e.WorldX, e.WorldY
				prev.PercentPos = e.PercentPos
				prev.OnActiveMap = e.OnActiveMap
				prev.MapID = e.MapID
			}
			prev.EditableHP = prev.EditableHP || e.EditableHP
			prev.EditableAC = prev.EditableAC || e.EditableAC
			prev.EditableCond = prev.EditableCond || e.EditableCond
			prev.EditableInit = true
			return
		}
		e.EditableInit = true
		cp := e
		byKey[e.Key] = &cp
	}

	// Party refs
	for _, ref := range in.Campaign.Party {
		switch ref.Type {
		case "pc":
			ch, ok := charByCat[ref.ID]
			if !ok {
				ch, ok = charByID[ref.ID]
			}
			if !ok {
				continue
			}
			e := Entity{
				Key:          TrackerKey("pc", ch.ID),
				Kind:         "pc",
				Name:         ch.Name,
				HPCurrent:    ch.HPCurrent,
				HPMax:        ch.HPMax,
				CharacterID:  ch.ID,
				CatalogueID:  ref.ID,
				EditableHP:   true,
				EditableAC:   true,
				EditableCond: true,
			}
			if st := in.CharStates[ch.ID]; st != nil {
				if st.HPCurrent != nil {
					e.HPCurrent = st.HPCurrent
				}
				if st.HPMax != nil {
					e.HPMax = st.HPMax
				}
				e.Conditions = ConditionsToText(st.Conditions)
			}
			if sheet := in.CharSheets[ch.ID]; sheet != nil {
				e.AC = SheetAC(sheet.Sheet)
				e.PP = PassivePerception(sheet.Sheet)
			}
			if pos, ok := in.MapState.PartyPositions["pc:"+ch.ID]; ok {
				e.HasWorldPos = true
				e.PercentPos = true
				e.WorldX, e.WorldY = pos.X, pos.Y
				e.MapID = pos.MapID
				e.OnActiveMap = mapIDMatches(pos.MapID, active)
			} else if pos, ok := in.MapState.PartyPositions["pc:"+ref.ID]; ok {
				e.HasWorldPos = true
				e.PercentPos = true
				e.WorldX, e.WorldY = pos.X, pos.Y
				e.MapID = pos.MapID
				e.OnActiveMap = mapIDMatches(pos.MapID, active)
			}
			addOrMerge(e)
		case "npc":
			entry := in.NPCByID[ref.ID]
			name := ref.ID
			var cur, max *float64
			var ac *float64
			cond := ""
			if entry != nil {
				if n, ok := entry["name"].(string); ok && n != "" {
					name = n
				}
				cur, max = ParseHPBlob(entry["hp"])
				ac = ParseAC(entry["ac"])
				if c, ok := entry["combatConditions"].(string); ok {
					cond = c
				}
			}
			e := Entity{
				Key:          TrackerKey("npc", ref.ID),
				Kind:         "npc",
				Name:         name,
				HPCurrent:    cur,
				HPMax:        max,
				AC:           ac,
				Conditions:   cond,
				CatalogueID:  ref.ID,
				EditableHP:   true,
				EditableAC:   true,
				EditableCond: true,
			}
			if pos, ok := in.MapState.PartyPositions["npc:"+ref.ID]; ok {
				e.HasWorldPos = true
				e.PercentPos = true
				e.WorldX, e.WorldY = pos.X, pos.Y
				e.MapID = pos.MapID
				e.OnActiveMap = mapIDMatches(pos.MapID, active)
			}
			addOrMerge(e)
		}
	}

	// Tokens on any map — show those on active map preferentially in list too
	for mapID, list := range in.MapState.Tokens {
		for _, tok := range list {
			if tok.Visible != nil && !*tok.Visible {
				continue
			}
			e := Entity{
				Key:          TrackerKey("monster", tok.ID),
				Kind:         "monster",
				Name:         tok.Label,
				HPCurrent:    tok.HPCurrent,
				HPMax:        tok.HPMax,
				AC:           tok.AC,
				Conditions:   tok.Conditions,
				TokenID:      tok.ID,
				CatalogueID:  tok.CatalogueID,
				MapID:        mapID,
				HasWorldPos:  true,
				WorldX:       tok.X,
				WorldY:       tok.Y,
				OnActiveMap:  mapIDMatches(mapID, active),
				EditableHP:   false, // array replace concurrency risk
				EditableAC:   false,
				EditableCond: false,
			}
			if e.Name == "" {
				e.Name = tok.ID
			}
			addOrMerge(e)
		}
	}

	// Overlay initiative tracker (may include combatants not otherwise listed)
	for key, entry := range in.MapState.InitiativeTracker {
		if e, ok := byKey[key]; ok {
			e.Initiative = entry.Initiative
			if entry.Name != "" {
				e.Name = entry.Name
			}
			continue
		}
		kind := entry.Kind
		if kind == "" {
			kind = "combatant"
		}
		addOrMerge(Entity{
			Key:          key,
			Kind:         kind,
			Name:         entry.Name,
			Initiative:   entry.Initiative,
			EditableHP:   false,
			EditableAC:   false,
			EditableCond: false,
		})
	}

	entities := make([]Entity, 0, len(byKey))
	for _, e := range byKey {
		entities = append(entities, *e)
	}
	// Sort: initiative desc, then name
	sortEntities(entities)
	snap.Entities = entities
	return snap
}

func mapIDMatches(a, active string) bool {
	if a == "" || active == "" {
		return false
	}
	if a == active {
		return true
	}
	return LocationLinkID(a) == LocationLinkID(active) || strings.EqualFold(a, active)
}

func sortEntities(entities []Entity) {
	// bubble sort-free: reuse initiative ordering preference
	for i := 0; i < len(entities); i++ {
		for j := i + 1; j < len(entities); j++ {
			ai, aj := entities[i].Initiative, entities[j].Initiative
			// 0 sorts last
			aiZ, ajZ := ai == 0, aj == 0
			swap := false
			if aiZ != ajZ {
				swap = aiZ // zeros after
			} else if ai != aj {
				swap = ai < aj
			} else if strings.ToLower(entities[i].Name) > strings.ToLower(entities[j].Name) {
				swap = true
			}
			if swap {
				entities[i], entities[j] = entities[j], entities[i]
			}
		}
	}
}
