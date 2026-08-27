package ui

import (
	"strings"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/api"
)

// FilterSceneSwitcher filters scenes by title, id, group title, or location id.
func FilterSceneSwitcher(scenes []api.SceneListItem, groups []map[string]any, query string) []api.SceneListItem {
	q := strings.ToLower(strings.TrimSpace(query))
	groupTitle := map[string]string{}
	for _, g := range groups {
		id, _ := g["id"].(string)
		title, _ := g["title"].(string)
		if id != "" {
			groupTitle[id] = title
		}
	}
	if q == "" {
		return append([]api.SceneListItem(nil), scenes...)
	}
	var out []api.SceneListItem
	for _, s := range scenes {
		gt := groupTitle[s.GroupID]
		hay := strings.ToLower(s.Title + " " + s.ID + " " + s.GroupID + " " + gt + " " + s.LocationID)
		if strings.Contains(hay, q) {
			out = append(out, s)
		}
	}
	return out
}

// RankSceneSwitcher puts current scene first, then keeps list order.
func RankSceneSwitcher(scenes []api.SceneListItem, currentID string) []api.SceneListItem {
	if currentID == "" || len(scenes) < 2 {
		return scenes
	}
	out := make([]api.SceneListItem, 0, len(scenes))
	var cur *api.SceneListItem
	for i := range scenes {
		if scenes[i].ID == currentID {
			cp := scenes[i]
			cur = &cp
			continue
		}
		out = append(out, scenes[i])
	}
	if cur == nil {
		return scenes
	}
	return append([]api.SceneListItem{*cur}, out...)
}
