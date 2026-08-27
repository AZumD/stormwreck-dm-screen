package ui

import (
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/actions"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/music"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/nav"
)

func (m *Model) handleKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	if m.screen == screenLogin {
		return m.handleLoginKey(msg)
	}
	if m.edit != editNone {
		return m.handleEditKey(msg)
	}
	if m.searching {
		return m.handleSearchKey(msg)
	}
	if m.editingNotes {
		return m.handleNotesEditKey(msg)
	}

	key := msg.String()
	act, ok := actions.LookupFKey(key)
	if !ok {
		act, ok = actions.Resolve(key, false)
	}
	if !ok {
		return m, nil
	}
	return m.dispatchAction(act)
}

func (m *Model) dispatchAction(act actions.Action) (tea.Model, tea.Cmd) {
	switch act {
	case actions.Quit:
		_ = m.player.Stop()
		return m, tea.Quit
	case actions.AppHome:
		if m.screen == screenCampaign || m.overlay != overlayNone {
			m.leaveCampaignToHome()
			return m, m.cmdLoadHome()
		}
		return m, nil
	case actions.AppBack:
		return m.handleBack()
	case actions.AppSearch:
		m.beginSearch()
		return m, textinput.Blink
	case actions.AppLibrary:
		if m.screen == screenCampaign && m.overlay == overlayNone {
			m.history.Push(nav.Frame{Name: "campaign", Cursor: int(m.tab), Data: map[string]string{"campaignId": m.campaignID}})
			m.overlay = overlayLibrary
			m.libType = ""
			m.libEntries = nil
			m.homeCursor = 0
			if len(m.catalogueTypes) == 0 {
				return m, m.cmdLoadHome()
			}
			return m, nil
		}
		return m, nil
	case actions.CampaignScene:
		return m.setTab(tabScene)
	case actions.CampaignNotes:
		return m.setTab(tabNotes)
	case actions.CampaignParty:
		return m.setTab(tabParty)
	case actions.CampaignMap:
		return m.setTab(tabMap)
	case actions.CampaignMusic:
		return m.setTab(tabMusic)
	case actions.NotesNew:
		if m.screen != screenCampaign {
			return m, nil
		}
		m.tab = tabNotes
		m.overlay = overlayNone
		m.beginNotesEdit()
		return m, textinput.Blink
	case actions.SelUp:
		m.moveSelection(-1)
		return m, nil
	case actions.SelDown:
		m.moveSelection(1)
		return m, nil
	case actions.SelOpen:
		return m.handleOpen()
	case actions.CharHP:
		return m.beginPartyEdit(editHP, "HP (+/-/delta or =n or n/m)", "")
	case actions.CharInit:
		cur := ""
		if e := m.selectedEntity(); e != nil && e.Initiative != 0 {
			cur = trimNum(e.Initiative)
		}
		return m.beginPartyEdit(editInit, "Initiative (0 clears)", cur)
	case actions.CharCond:
		cur := ""
		if e := m.selectedEntity(); e != nil {
			cur = e.Conditions
		}
		return m.beginPartyEdit(editCond, "Conditions (comma-separated)", cur)
	case actions.CharAC:
		cur := ""
		if e := m.selectedEntity(); e != nil && e.AC != nil {
			cur = trimNum(*e.AC)
		}
		return m.beginPartyEdit(editAC, "AC", cur)
	case actions.MusicToggle:
		m.doMusicToggle()
		return m, nil
	case actions.MusicStopAll:
		_ = m.player.Stop()
		m.nowPlaying = ""
		return m, nil
	case actions.MusicVolUp:
		m.musicVol = minf(100, m.musicVol+5)
		_ = m.player.SetVolume(m.musicVol)
		return m, nil
	case actions.MusicVolDown:
		m.musicVol = maxf(0, m.musicVol-5)
		_ = m.player.SetVolume(m.musicVol)
		return m, nil
	case actions.MusicLoop:
		m.musicLoop = !m.musicLoop
		_ = m.player.SetLoop(m.musicLoop)
		return m, nil
	}
	return m, nil
}

func (m *Model) setTab(t campaignTab) (tea.Model, tea.Cmd) {
	if m.screen != screenCampaign || m.overlay != overlayNone {
		return m, nil
	}
	m.tab = t
	if t == tabScene {
		return m, m.cmdReloadScene()
	}
	return m, nil
}

func (m *Model) cmdReloadScene() tea.Cmd {
	client := m.client
	id := m.campaignID
	return func() tea.Msg {
		b, err := loadSceneBundle(client, id)
		return sceneLoadedMsg{bundle: b, err: err}
	}
}

func (m *Model) leaveCampaignToHome() {
	m.campaignID = ""
	m.campaignTitle = ""
	m.overlay = overlayNone
	m.screen = screenHome
	m.searching = false
	m.editingNotes = false
	m.edit = editNone
}

func (m *Model) handleBack() (tea.Model, tea.Cmd) {
	switch {
	case m.overlay == overlayCatalogue || m.screen == screenCatalogueDetail:
		if f, ok := m.history.Pop(); ok {
			m.restoreFrame(f)
			return m, nil
		}
		if m.campaignID != "" {
			m.overlay = overlayNone
			m.screen = screenCampaign
			return m, nil
		}
		m.screen = screenLibraryList
		return m, nil
	case m.overlay == overlayCharSheet:
		if f, ok := m.history.Pop(); ok {
			m.restoreFrame(f)
		}
		m.overlay = overlayNone
		m.sheetChar = nil
		return m, nil
	case m.overlay == overlayLibrary && m.libType != "":
		if f, ok := m.history.Pop(); ok {
			m.homeCursor = f.Cursor
		}
		m.libType = ""
		m.libEntries = nil
		return m, nil
	case m.overlay == overlayLibrary:
		if f, ok := m.history.Pop(); ok {
			m.restoreFrame(f)
		}
		m.overlay = overlayNone
		m.libType = ""
		return m, nil
	case m.screen == screenLibraryList:
		if f, ok := m.history.Pop(); ok {
			m.restoreFrame(f)
			return m, nil
		}
		m.screen = screenHome
		return m, m.cmdLoadHome()
	case m.screen == screenCampaign:
		m.leaveCampaignToHome()
		return m, m.cmdLoadHome()
	default:
		return m, nil
	}
}

func (m *Model) restoreFrame(f nav.Frame) {
	switch f.Name {
	case "home":
		m.screen = screenHome
		m.overlay = overlayNone
		m.homeCursor = f.Cursor
	case "library", "lib-types":
		if m.campaignID != "" {
			m.screen = screenCampaign
			m.overlay = overlayLibrary
		} else {
			m.screen = screenLibraryList
			m.overlay = overlayNone
		}
		m.libCursor = f.Cursor
		if t := f.Data["type"]; t != "" {
			m.libType = t
		} else if f.Name == "lib-types" {
			m.libType = ""
		}
		m.homeCursor = f.Cursor
	case "campaign", "sheet":
		m.screen = screenCampaign
		m.overlay = overlayNone
		m.tab = campaignTab(f.Cursor)
	default:
		m.overlay = overlayNone
	}
}

func (m *Model) moveSelection(delta int) {
	switch {
	case m.overlay == overlayCharSheet:
		n := len(m.sheetLinks)
		if n == 0 {
			return
		}
		m.sheetCursor = clampIndex(m.sheetCursor+delta, n)
	case m.overlay == overlayLibrary && m.libType == "":
		types := FilterCatalogueTypes(m.catalogueTypes, "")
		if len(types) == 0 {
			return
		}
		m.homeCursor = clampIndex(m.homeCursor+delta, len(types))
	case m.screen == screenHome:
		if len(m.homeRows) == 0 {
			return
		}
		m.homeCursor = clampIndex(m.homeCursor+delta, len(m.homeRows))
	case m.screen == screenLibraryList || (m.overlay == overlayLibrary && m.libType != ""):
		ents := m.filteredLibEntries()
		if len(ents) == 0 {
			return
		}
		m.libCursor = clampIndex(m.libCursor+delta, len(ents))
	case m.screen == screenCampaign && m.overlay == overlayNone:
		switch m.tab {
		case tabParty, tabMap:
			if len(m.snap.Entities) == 0 {
				return
			}
			m.selected = clampIndex(m.selected+delta, len(m.snap.Entities))
		case tabScene:
			if len(m.sceneRefs) == 0 {
				return
			}
			m.sceneRefSel = clampIndex(m.sceneRefSel+delta, len(m.sceneRefs))
		case tabMusic:
			if len(m.musicTracks) == 0 {
				return
			}
			m.musicCursor = clampIndex(m.musicCursor+delta, len(m.musicTracks))
		}
	}
}

func (m *Model) handleOpen() (tea.Model, tea.Cmd) {
	switch {
	case m.overlay == overlayCharSheet:
		if m.sheetCursor >= 0 && m.sheetCursor < len(m.sheetLinks) {
			link := m.sheetLinks[m.sheetCursor]
			if link.Type != "" && link.ID != "" {
				m.history.Push(nav.Frame{Name: "sheet", Cursor: m.sheetCursor})
				m.overlay = overlayCatalogue
				return m, m.cmdLoadCatalogue(link.Type, link.ID)
			}
		}
		return m, nil
	case m.overlay == overlayLibrary && m.libType == "":
		types := FilterCatalogueTypes(m.catalogueTypes, "")
		if m.homeCursor < 0 || m.homeCursor >= len(types) {
			return m, nil
		}
		typ := types[m.homeCursor]
		m.history.Push(nav.Frame{Name: "lib-types", Cursor: m.homeCursor})
		m.libType = typ
		m.libCursor = 0
		return m, m.cmdLoadLibrary(typ)
	case m.screen == screenHome:
		if m.homeCursor < 0 || m.homeCursor >= len(m.homeRows) {
			return m, nil
		}
		row := m.homeRows[m.homeCursor]
		if row.Kind == "campaign" {
			m.history.Push(nav.Frame{Name: "home", Cursor: m.homeCursor})
			return m, m.cmdOpenCampaign(row.ID)
		}
		m.history.Push(nav.Frame{Name: "home", Cursor: m.homeCursor})
		m.libType = row.ID
		m.libCursor = 0
		m.screen = screenLibraryList
		return m, m.cmdLoadLibrary(row.ID)
	case m.screen == screenLibraryList || (m.overlay == overlayLibrary && m.libType != ""):
		ents := m.filteredLibEntries()
		if m.libCursor < 0 || m.libCursor >= len(ents) {
			return m, nil
		}
		e := ents[m.libCursor]
		id := strField(e, "id")
		if id == "" {
			return m, nil
		}
		m.history.Push(nav.Frame{
			Name:   "library",
			Cursor: m.libCursor,
			Data:   map[string]string{"type": m.libType},
		})
		if m.overlay == overlayLibrary || m.campaignID != "" {
			m.overlay = overlayCatalogue
		} else {
			m.screen = screenCatalogueDetail
		}
		return m, m.cmdLoadCatalogue(m.libType, id)
	case m.screen == screenCampaign && m.overlay == overlayNone:
		switch m.tab {
		case tabScene:
			if m.sceneRefSel >= 0 && m.sceneRefSel < len(m.sceneRefs) {
				r := m.sceneRefs[m.sceneRefSel]
				m.history.Push(nav.Frame{Name: "campaign", Cursor: int(m.tab), Data: map[string]string{"campaignId": m.campaignID}})
				m.overlay = overlayCatalogue
				return m, m.cmdLoadCatalogue(r.Type, r.ID)
			}
		case tabParty:
			e := m.selectedEntity()
			if e == nil {
				return m, nil
			}
			if e.Kind == "pc" && e.CharacterID != "" {
				m.history.Push(nav.Frame{Name: "campaign", Cursor: int(m.tab)})
				return m, m.cmdLoadSheet(e.CharacterID)
			}
			if e.CatalogueID != "" {
				typ := e.Kind
				if typ == "monster" || typ == "npc" || typ == "pc" {
					m.history.Push(nav.Frame{Name: "campaign", Cursor: int(m.tab)})
					m.overlay = overlayCatalogue
					return m, m.cmdLoadCatalogue(typ, e.CatalogueID)
				}
			}
		case tabMusic:
			m.doMusicToggle()
			return m, nil
		}
	}
	return m, nil
}

func (m *Model) beginSearch() {
	m.searching = true
	m.searchInput.SetValue("")
	m.searchInput.Focus()
	m.errMsg = ""
}

func (m *Model) handleSearchKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "esc":
		m.searching = false
		m.searchInput.Blur()
		m.rebuildHomeRows()
		return m, nil
	case "enter":
		m.searching = false
		m.searchInput.Blur()
		m.rebuildHomeRows()
		if m.screen == screenLibraryList || m.overlay == overlayLibrary {
			m.libCursor = clampIndex(m.libCursor, len(m.filteredLibEntries()))
		}
		return m, nil
	case "ctrl+c":
		return m, tea.Quit
	}
	var cmd tea.Cmd
	m.searchInput, cmd = updateFocusedInput(m.searchInput, msg)
	if m.screen == screenHome {
		m.rebuildHomeRows()
	}
	return m, cmd
}

func (m *Model) handleLoginKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "ctrl+c":
		return m, tea.Quit
	case "tab", "down":
		m.focusPass = true
		m.emailInput.Blur()
		m.passInput.Focus()
		return m, textinput.Blink
	case "shift+tab", "up":
		m.focusPass = false
		m.passInput.Blur()
		m.emailInput.Focus()
		return m, textinput.Blink
	case "enter":
		email := strings.TrimSpace(m.emailInput.Value())
		pass := m.passInput.Value()
		if email == "" || pass == "" {
			m.errMsg = "email and password required"
			return m, nil
		}
		m.conn = connConnecting
		m.errMsg = ""
		return m, m.cmdLogin(email, pass)
	}
	var cmd tea.Cmd
	if m.focusPass {
		m.passInput, cmd = updateFocusedInput(m.passInput, msg)
	} else {
		m.emailInput, cmd = updateFocusedInput(m.emailInput, msg)
	}
	return m, cmd
}

func (m *Model) handleEditKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "esc":
		m.edit = editNone
		m.editInput.Blur()
		return m, nil
	case "enter":
		val := m.editInput.Value()
		mode := m.edit
		m.edit = editNone
		m.editInput.Blur()
		return m, m.cmdMutate(mode, val)
	case "ctrl+c":
		return m, tea.Quit
	}
	var cmd tea.Cmd
	m.editInput, cmd = updateFocusedInput(m.editInput, msg)
	return m, cmd
}

func (m *Model) beginNotesEdit() {
	m.editingNotes = true
	m.notesInput.SetValue(m.notesText)
	m.notesInput.Focus()
	m.errMsg = ""
}

func (m *Model) handleNotesEditKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "esc":
		m.editingNotes = false
		m.notesInput.Blur()
		m.notesInput.SetValue(m.notesText)
		return m, nil
	case "enter":
		// single-line enter saves; multiline would need textarea — keep simple save on enter
		m.notesText = m.notesInput.Value()
		m.editingNotes = false
		m.notesInput.Blur()
		return m, m.cmdSaveNotes()
	case "ctrl+c":
		return m, tea.Quit
	}
	var cmd tea.Cmd
	m.notesInput, cmd = updateFocusedInput(m.notesInput, msg)
	return m, cmd
}

func (m *Model) beginPartyEdit(mode editMode, placeholder, cur string) (tea.Model, tea.Cmd) {
	if m.screen != screenCampaign || (m.tab != tabParty && m.overlay != overlayCharSheet) {
		return m, nil
	}
	e := m.selectedEntity()
	if e == nil {
		return m, nil
	}
	switch mode {
	case editHP:
		if !e.EditableHP {
			m.errMsg = "HP not editable for this entity (monster tokens are read-only)"
			return m, nil
		}
	case editCond:
		if !e.EditableCond {
			m.errMsg = "Conditions not editable for this entity"
			return m, nil
		}
	case editAC:
		if !e.EditableAC {
			m.errMsg = "AC not editable for this entity"
			return m, nil
		}
	}
	m.edit = mode
	m.editInput.Placeholder = placeholder
	m.editInput.SetValue(cur)
	m.editInput.Focus()
	m.errMsg = ""
	return m, textinput.Blink
}

func (m *Model) doMusicToggle() {
	if !m.player.Available() {
		m.errMsg = "mpv not available — install mpv for local playback"
		return
	}
	if m.musicCursor < 0 || m.musicCursor >= len(m.musicTracks) {
		_ = m.player.Toggle()
		return
	}
	tr := m.musicTracks[m.musicCursor]
	url := m.client.MusicStreamURL(tr.CatalogueMusicID)
	hdr := m.client.SessionCookieHeader()
	var headers []string
	if hdr != "" {
		headers = append(headers, hdr)
	}
	if m.player.IsPlaying() && m.player.CurrentURL() == url {
		_ = m.player.Toggle()
		if !m.player.IsPlaying() {
			m.nowPlaying = ""
		}
		return
	}
	playVol := m.musicVol
	if tr.Volume > 0 {
		playVol = tr.Volume
	}
	playLoop := m.musicLoop || tr.Loop
	if err := m.player.Play(url, playVol, playLoop, headers...); err != nil {
		if err == music.ErrUnavailable {
			m.errMsg = "mpv not available — install mpv for local playback"
			return
		}
		m.errMsg = err.Error()
		return
	}
	m.nowPlaying = tr.Title
	m.errMsg = ""
}
