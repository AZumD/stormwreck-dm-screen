// Package actions is the centralized TUI action / hotkey layer.
// Hardware keys (e.g. F13–F16) and keyboard bindings resolve to the same Action values.
package actions

import "strings"

// Action is a named UI command independent of any particular key.
type Action string

const (
	AppHome        Action = "app.home"
	AppBack        Action = "app.back"
	AppSearch      Action = "app.search"
	AppLibrary     Action = "app.library"
	CampaignScene  Action = "campaign.scene"
	CampaignNotes  Action = "campaign.notes"
	CampaignParty  Action = "campaign.party"
	CampaignMap    Action = "campaign.map"
	CampaignMusic  Action = "campaign.music"
	NotesNew       Action = "notes.new"
	SelUp          Action = "selection.up"
	SelDown        Action = "selection.down"
	SelOpen        Action = "selection.open"
	CharHP         Action = "character.hp.edit"
	CharCond       Action = "character.conditions.edit"
	CharInit       Action = "character.initiative.edit"
	CharAC         Action = "character.ac.edit"
	MusicToggle    Action = "music.toggle"
	MusicStopAll   Action = "music.stop_all"
	MusicVolUp     Action = "music.volume_up"
	MusicVolDown   Action = "music.volume_down"
	MusicLoop      Action = "music.loop_toggle"
	Quit           Action = "app.quit"
)

// DefaultBindings maps each action to bubbletea KeyMsg.String()-style keys.
func DefaultBindings() map[Action][]string {
	return map[Action][]string{
		AppHome:       {"ctrl+h"},
		AppBack:       {"esc", "backspace"},
		AppSearch:     {"/"},
		AppLibrary:    {"ctrl+l"},
		CampaignScene: {"1"},
		CampaignNotes: {"2"},
		CampaignParty: {"3"},
		CampaignMap:   {"4"},
		CampaignMusic: {"5"},
		NotesNew:      {"shift+n"},
		SelUp:         {"k", "up"},
		SelDown:       {"j", "down"},
		SelOpen:       {"enter"},
		CharHP:        {"h"},
		CharCond:      {"c"},
		CharInit:      {"i"},
		CharAC:        {"a"},
		MusicToggle:   {" "},
		MusicStopAll:  {"s"},
		MusicVolUp:    {"+"},
		MusicVolDown:  {"-"},
		MusicLoop:     {"l"},
		Quit:          {"q", "ctrl+c"},
	}
}

// reverseBindings builds key → action from DefaultBindings (first wins on collision).
func reverseBindings() map[string]Action {
	out := make(map[string]Action)
	for act, keys := range DefaultBindings() {
		for _, k := range keys {
			if _, ok := out[k]; !ok {
				out[k] = act
			}
		}
	}
	return out
}

var keyToAction = reverseBindings()

// Resolve maps a key string to an Action.
// When editing is true, only esc (back), enter (open/confirm), and ctrl+c (quit)
// are accepted so single-letter globals (h/i/c/l/s/…) never fire.
func Resolve(key string, editing bool) (Action, bool) {
	key = strings.ToLower(strings.TrimSpace(key))
	if key == "" {
		return "", false
	}
	if editing {
		switch key {
		case "esc":
			return AppBack, true
		case "enter":
			return SelOpen, true
		case "ctrl+c":
			return Quit, true
		default:
			return "", false
		}
	}
	act, ok := keyToAction[key]
	return act, ok
}

// LookupFKey maps F13–F16 stubs for future physical DM-screen hardware.
// F13→scene, F14→map, F15→notes.new, F16→music.toggle.
func LookupFKey(key string) (Action, bool) {
	switch strings.ToLower(strings.TrimSpace(key)) {
	case "f13":
		return CampaignScene, true
	case "f14":
		return CampaignMap, true
	case "f15":
		return NotesNew, true
	case "f16":
		return MusicToggle, true
	default:
		return "", false
	}
}
