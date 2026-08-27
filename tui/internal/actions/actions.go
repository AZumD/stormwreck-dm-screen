package actions

import "strings"

// Action is a named UI command independent of any particular key.
type Action string

const (
	AppHome       Action = "app.home"
	AppBack       Action = "app.back"
	AppSearch     Action = "app.search"
	AppLibrary    Action = "app.library"
	AppLookup     Action = "app.lookup"
	CampaignScene Action = "campaign.scene"
	CampaignNotes Action = "campaign.notes"
	CampaignParty Action = "campaign.party"
	CampaignMap   Action = "campaign.map"
	CampaignMusic Action = "campaign.music"

	SceneEdit       Action = "scene.edit"
	SceneSave       Action = "scene.save"
	SceneCancel     Action = "scene.cancel"
	SceneSwitch     Action = "scene.switch"
	SceneNote       Action = "scene.note"
	SceneStatusNext Action = "scene.status.next"
	SceneStatusPrev Action = "scene.status.prev"

	NotesQuick Action = "notes.quick"
	NotesNew   Action = "notes.new" // alias kept for F15 stub

	TimeFocus Action = "time.focus"

	AdjustDec      Action = "adjust.dec"
	AdjustInc      Action = "adjust.inc"
	AdjustDecLarge Action = "adjust.dec_large"
	AdjustIncLarge Action = "adjust.inc_large"

	ScrollPageUp   Action = "scroll.page_up"
	ScrollPageDown Action = "scroll.page_down"

	SelUp     Action = "selection.up"
	SelDown   Action = "selection.down"
	SelOpen   Action = "selection.open"
	PanePrev  Action = "selection.pane_prev"
	PaneNext  Action = "selection.pane_next"
	RefPrev   Action = "selection.ref_prev"
	RefNext   Action = "selection.ref_next"
	CharHP    Action = "character.hp.edit"
	CharCond  Action = "character.conditions.edit"
	CharInit  Action = "character.initiative.edit"
	CharAC    Action = "character.ac.edit"
	MusicToggle  Action = "music.toggle"
	MusicStopAll Action = "music.stop_all"
	MusicVolUp   Action = "music.volume_up"
	MusicVolDown Action = "music.volume_down"
	MusicLoop    Action = "music.loop_toggle"
	Quit         Action = "app.quit"
)

// DefaultBindings maps each action to bubbletea KeyMsg.String()-style keys.
// Pane switching is Tab/Shift+Tab only — arrows adjust values within the focused pane.
func DefaultBindings() map[Action][]string {
	return map[Action][]string{
		AppHome:       {"ctrl+h"},
		AppBack:       {"esc", "backspace"},
		AppSearch:     {"/"},
		AppLibrary:    {"ctrl+l"},
		AppLookup:     {"ctrl+k"},
		CampaignScene: {"1"},
		CampaignNotes: {"2"},
		CampaignParty: {"3"},
		CampaignMap:   {"4"},
		CampaignMusic: {"5"},
		SceneEdit:       {"shift+e"},
		SceneSave:       {"ctrl+s"},
		SceneSwitch:     {"shift+s"},
		SceneNote:       {"n"},
		NotesQuick:      {"shift+n"},
		TimeFocus:       {"t"},
		AdjustDec:       {"left"},
		AdjustInc:       {"right"},
		AdjustDecLarge:  {"shift+left"},
		AdjustIncLarge:  {"shift+right"},
		ScrollPageUp:    {"pgup", "ctrl+u"},
		ScrollPageDown:  {"pgdown", "ctrl+d"},
		SelUp:           {"k", "up"},
		SelDown:         {"j", "down"},
		SelOpen:         {"enter"},
		PanePrev:        {"shift+tab"},
		PaneNext:        {"tab"},
		RefPrev:         {"[", "shift+k", "shift+up"},
		RefNext:         {"]", "shift+j", "shift+down"},
		CharHP:          {"h"},
		CharCond:        {"c"},
		CharInit:        {"i"},
		CharAC:          {"a"},
		MusicToggle:     {" "},
		MusicStopAll:    {"s"},
		MusicVolUp:      {"+"},
		MusicVolDown:    {"-"},
		MusicLoop:       {"l"},
		Quit:            {"q", "ctrl+c"},
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
// When editing is true, only esc, enter, ctrl+c, ctrl+k, and ctrl+s are accepted.
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
		case "ctrl+k":
			return AppLookup, true
		case "ctrl+s":
			return SceneSave, true
		default:
			return "", false
		}
	}
	act, ok := keyToAction[key]
	return act, ok
}

// LookupFKey maps F13–F16 stubs for future physical DM-screen hardware.
func LookupFKey(key string) (Action, bool) {
	switch strings.ToLower(strings.TrimSpace(key)) {
	case "f13":
		return CampaignScene, true
	case "f14":
		return CampaignMap, true
	case "f15":
		return NotesQuick, true
	case "f16":
		return MusicToggle, true
	default:
		return "", false
	}
}

// CycleSceneStatus returns the next/prev status in the canonical order.
func CycleSceneStatus(current string, delta int) string {
	order := []string{"unseen", "current", "completed", "skipped"}
	idx := 0
	cur := strings.ToLower(strings.TrimSpace(current))
	for i, s := range order {
		if s == cur {
			idx = i
			break
		}
	}
	n := len(order)
	idx = ((idx + delta) % n + n) % n
	return order[idx]
}
