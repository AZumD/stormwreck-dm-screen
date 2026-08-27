package ui

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/api"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/model"
)

func fetchSnapshot(client *api.Client, campaignID string) (model.Snapshot, error) {
	mapRaw, err := client.GetDocument(campaignID, "map-state")
	if err != nil {
		return model.Snapshot{}, err
	}
	csRaw, err := client.GetDocument(campaignID, "campaign-state")
	if err != nil {
		return model.Snapshot{}, err
	}
	locRaw, err := client.GetDocument(campaignID, "locations")
	if err != nil {
		return model.Snapshot{}, err
	}
	ms, err := model.ParseMapState(mapRaw)
	if err != nil {
		return model.Snapshot{}, err
	}
	cs, err := model.ParseCampaignState(csRaw)
	if err != nil {
		return model.Snapshot{}, err
	}
	locs, err := model.ParseLocations(locRaw)
	if err != nil {
		return model.Snapshot{}, err
	}

	locCat, err := client.ListCatalogue("location")
	if err != nil {
		return model.Snapshot{}, err
	}
	chars, err := client.ListCharacters(campaignID)
	if err != nil {
		return model.Snapshot{}, err
	}

	sheets := map[string]*api.Character{}
	states := map[string]*api.CharacterState{}
	for _, ch := range chars {
		c, err := client.GetCharacter(campaignID, ch.ID)
		if err == nil {
			sheets[ch.ID] = c
		}
		st, err := client.GetCharacterState(campaignID, ch.ID)
		if err == nil {
			states[ch.ID] = st
		}
	}

	npcByID := map[string]map[string]any{}
	for _, ref := range cs.Party {
		if ref.Type != "npc" {
			continue
		}
		entry, err := client.GetCatalogue("npc", ref.ID)
		if err == nil {
			npcByID[ref.ID] = entry
		}
	}

	snap := model.BuildSnapshot(model.BuildInput{
		CampaignID:  campaignID,
		MapState:    ms,
		Campaign:    cs,
		Locations:   locs,
		LocationCat: locCat,
		Characters:  chars,
		CharSheets:  sheets,
		CharStates:  states,
		NPCByID:     npcByID,
	})
	return snap, nil
}

func applyMutation(client *api.Client, campaignID string, e model.Entity, mode editMode, raw string) error {
	switch mode {
	case editInit:
		v := 0.0
		s := strings.TrimSpace(raw)
		if s != "" {
			f, err := strconv.ParseFloat(s, 64)
			if err != nil {
				return err
			}
			v = f
		}
		patch := model.InitiativePatch(e.Key, e.Name, e.Kind, v)
		_, err := client.PatchDocument(campaignID, "map-state", patch)
		return err
	case editHP:
		if !e.EditableHP {
			return fmt.Errorf("HP read-only")
		}
		cur, maxHP, err := model.ApplyHPInput(e.HPCurrent, e.HPMax, raw)
		if err != nil {
			return err
		}
		if e.Kind == "pc" && e.CharacterID != "" {
			body := map[string]any{}
			if cur != nil {
				body["hp_current"] = *cur
			}
			if maxHP != nil {
				body["hp_max"] = *maxHP
			}
			_, err := client.PutCharacterState(campaignID, e.CharacterID, body)
			return err
		}
		if e.Kind == "npc" && e.CatalogueID != "" {
			entry, err := client.GetCatalogue("npc", e.CatalogueID)
			if err != nil {
				return err
			}
			entry["hp"] = model.FormatNPCHealth(cur, maxHP)
			_, err = client.PutCatalogue("npc", e.CatalogueID, entry)
			return err
		}
		return fmt.Errorf("unsupported HP target")
	case editCond:
		if !e.EditableCond {
			return fmt.Errorf("conditions read-only")
		}
		if e.Kind == "pc" && e.CharacterID != "" {
			_, err := client.PutCharacterState(campaignID, e.CharacterID, map[string]any{
				"conditions": model.TextToConditionsExport(raw),
			})
			return err
		}
		if e.Kind == "npc" && e.CatalogueID != "" {
			entry, err := client.GetCatalogue("npc", e.CatalogueID)
			if err != nil {
				return err
			}
			entry["combatConditions"] = strings.TrimSpace(raw)
			_, err = client.PutCatalogue("npc", e.CatalogueID, entry)
			return err
		}
		return fmt.Errorf("unsupported conditions target")
	case editAC:
		if !e.EditableAC {
			return fmt.Errorf("AC read-only")
		}
		f, err := strconv.ParseFloat(strings.TrimSpace(raw), 64)
		if err != nil {
			return err
		}
		if e.Kind == "pc" && e.CharacterID != "" {
			_, err := client.PatchCharacter(campaignID, e.CharacterID, map[string]any{"ac": f})
			return err
		}
		if e.Kind == "npc" && e.CatalogueID != "" {
			entry, err := client.GetCatalogue("npc", e.CatalogueID)
			if err != nil {
				return err
			}
			entry["ac"] = trimNum(f)
			_, err = client.PutCatalogue("npc", e.CatalogueID, entry)
			return err
		}
		return fmt.Errorf("unsupported AC target")
	default:
		return nil
	}
}

func parseNotesText(raw json.RawMessage) string {
	if len(raw) == 0 {
		return ""
	}
	var doc struct {
		Text string `json:"text"`
	}
	if err := json.Unmarshal(raw, &doc); err == nil {
		return doc.Text
	}
	var s string
	if err := json.Unmarshal(raw, &s); err == nil {
		return s
	}
	return string(raw)
}

type musicTrackRow struct {
	MixerID         string
	CatalogueMusicID string
	Title           string
	Volume          float64
	Loop            bool
}

func parseMusicMixerTracks(raw json.RawMessage, catByID map[string]map[string]any) []musicTrackRow {
	var doc struct {
		Tracks []struct {
			ID               string  `json:"id"`
			CatalogueMusicID string  `json:"catalogueMusicId"`
			Title            string  `json:"title"`
			Volume           float64 `json:"volume"`
			Loop             bool    `json:"loop"`
			Order            float64 `json:"order"`
		} `json:"tracks"`
	}
	_ = json.Unmarshal(raw, &doc)
	out := make([]musicTrackRow, 0, len(doc.Tracks))
	for _, t := range doc.Tracks {
		title := t.Title
		if title == "" {
			if e := catByID[t.CatalogueMusicID]; e != nil {
				title = strField(e, "name", "title")
			}
		}
		if title == "" {
			title = t.CatalogueMusicID
		}
		vol := t.Volume
		if vol <= 0 {
			vol = 0.7
		}
		if vol <= 1 {
			vol = vol * 100
		}
		out = append(out, musicTrackRow{
			MixerID:          t.ID,
			CatalogueMusicID: t.CatalogueMusicID,
			Title:            title,
			Volume:           vol,
			Loop:             t.Loop,
		})
	}
	return out
}
