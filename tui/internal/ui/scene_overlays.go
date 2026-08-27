package ui

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/charmbracelet/bubbles/textarea"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/api"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/nav"
)

type scenePatchedMsg struct {
	detail    *api.SceneDetail
	statusMsg string
	reload    bool
	err       error
}

type clockSavedMsg struct {
	clock     CampaignClock
	statusMsg string
	err       error
}

func newOverlayTextarea() textarea.Model {
	ta := textarea.New()
	ta.CharLimit = 0
	ta.ShowLineNumbers = false
	ta.Prompt = ""
	ta.Placeholder = ""
	ta.SetWidth(60)
	ta.SetHeight(12)
	return ta
}

func parseCampaignClock(raw json.RawMessage) CampaignClock {
	def := NormalizeClock(1, 8*60)
	if len(raw) == 0 || string(raw) == "null" {
		return def
	}
	var doc struct {
		Clock *struct {
			Day     *float64 `json:"day"`
			Minute  *float64 `json:"minute"`
			Minutes *float64 `json:"minutes"`
		} `json:"clock"`
	}
	if err := json.Unmarshal(raw, &doc); err != nil || doc.Clock == nil {
		return def
	}
	day := 1
	if doc.Clock.Day != nil {
		day = int(*doc.Clock.Day)
	}
	minute := 8 * 60
	if doc.Clock.Minute != nil {
		minute = int(*doc.Clock.Minute)
	} else if doc.Clock.Minutes != nil {
		minute = int(*doc.Clock.Minutes)
	}
	return NormalizeClock(day, minute)
}

func (m *Model) textareaOverlayActive() bool {
	switch m.overlay {
	case overlaySceneEdit, overlaySceneNote, overlayQuickNotes:
		return true
	default:
		return false
	}
}

func (m *Model) beginSceneEdit() (tea.Model, tea.Cmd) {
	if m.screen != screenCampaign || m.sceneDetail == nil {
		return m, nil
	}
	m.overlay = overlaySceneEdit
	m.overlayTA.SetWidth(max(40, m.width-8))
	m.overlayTA.SetHeight(max(8, m.height-10))
	m.overlayTA.SetValue(m.sceneDetail.Content)
	m.overlayTA.Focus()
	m.errMsg = ""
	m.status = "Editing scene content"
	return m, textinput.Blink
}

func (m *Model) beginSceneNote() (tea.Model, tea.Cmd) {
	if m.screen != screenCampaign || m.sceneDetail == nil {
		return m, nil
	}
	m.overlay = overlaySceneNote
	m.overlayTA.SetWidth(max(40, m.width-8))
	m.overlayTA.SetHeight(max(6, m.height/3))
	notes := ""
	if m.sceneDetail != nil {
		notes = m.sceneDetail.Notes
	}
	m.overlayTA.SetValue(notes)
	m.overlayTA.Focus()
	m.errMsg = ""
	m.status = "Scene play notes"
	return m, textinput.Blink
}

func (m *Model) beginQuickNotes() (tea.Model, tea.Cmd) {
	if m.campaignID == "" {
		return m, nil
	}
	m.pushQuickNotesReturnFrame()
	m.overlay = overlayQuickNotes
	m.overlayTA.SetWidth(max(40, m.width-8))
	m.overlayTA.SetHeight(max(8, m.height-10))
	m.overlayTA.SetValue(m.notesText)
	m.overlayTA.Focus()
	m.errMsg = ""
	m.status = "Quick notes"
	return m, textinput.Blink
}

func (m *Model) pushQuickNotesReturnFrame() {
	switch {
	case m.overlay == overlayLookup:
		m.history.Push(nav.Frame{
			Name:   "lookup",
			Cursor: m.lookupCursor,
			Data:   map[string]string{"q": m.searchInput.Value()},
		})
	case m.overlay == overlayCatalogue:
		m.history.Push(nav.Frame{
			Name:   "catalogue",
			Cursor: m.detailCursor,
			Data: map[string]string{
				"type": m.libDetailT,
				"id":   strField(m.libDetail, "id"),
			},
		})
	case m.overlay == overlayCharSheet:
		m.history.Push(nav.Frame{Name: "sheet", Cursor: m.sheetCursor})
	case m.overlay == overlayLibrary:
		data := map[string]string{}
		if m.libType != "" {
			data["type"] = m.libType
		}
		name := "lib-types"
		if m.libType != "" {
			name = "library"
		}
		m.history.Push(nav.Frame{Name: name, Cursor: m.libCursor, Data: data})
	case m.screen == screenCampaign:
		m.history.Push(nav.Frame{
			Name:   "campaign",
			Cursor: int(m.tab),
			Data:   map[string]string{"campaignId": m.campaignID},
		})
	}
}

func (m *Model) beginSceneSwitcher() (tea.Model, tea.Cmd) {
	if m.screen != screenCampaign || m.sceneList == nil {
		return m, nil
	}
	m.overlay = overlaySceneSwitch
	m.switchInput.SetValue("")
	m.switchInput.Placeholder = "filter scenes…"
	m.switchInput.Focus()
	m.rebuildSceneSwitcher()
	m.errMsg = ""
	m.status = "Scene switcher"
	return m, textinput.Blink
}

func (m *Model) rebuildSceneSwitcher() {
	if m.sceneList == nil {
		m.switchRows = nil
		m.switchCursor = 0
		return
	}
	curID := ""
	if m.sceneDetail != nil {
		curID = m.sceneDetail.ID
	} else {
		curID = m.sceneList.CurrentSceneID
	}
	filtered := FilterSceneSwitcher(m.sceneList.Scenes, m.sceneList.Groups, m.switchInput.Value())
	m.switchRows = RankSceneSwitcher(filtered, curID)
	m.switchCursor = clampIndex(m.switchCursor, len(m.switchRows))
}

func (m *Model) closeTextareaOverlay(restoreHistory bool) {
	m.overlayTA.Blur()
	m.overlayTA.Reset()
	if restoreHistory {
		if f, ok := m.history.Pop(); ok {
			m.restoreFrame(f)
			return
		}
	}
	m.overlay = overlayNone
}

func (m *Model) handleTextareaOverlayKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "ctrl+c":
		return m, tea.Quit
	case "ctrl+k":
		return m.openMasterLookup()
	case "esc":
		restore := m.overlay == overlayQuickNotes
		m.closeTextareaOverlay(restore)
		m.status = ""
		return m, nil
	case "ctrl+s":
		return m.saveTextareaOverlay()
	}
	var cmd tea.Cmd
	m.overlayTA, cmd = updateFocusedTextarea(m.overlayTA, msg)
	return m, cmd
}

func (m *Model) saveTextareaOverlay() (tea.Model, tea.Cmd) {
	text := m.overlayTA.Value()
	switch m.overlay {
	case overlaySceneEdit:
		if m.sceneDetail == nil {
			return m, nil
		}
		sid := m.sceneDetail.ID
		m.closeTextareaOverlay(false)
		return m, m.cmdPatchScene(sid, map[string]any{"content": text}, "Scene saved")
	case overlaySceneNote:
		if m.sceneDetail == nil {
			return m, nil
		}
		sid := m.sceneDetail.ID
		m.closeTextareaOverlay(false)
		return m, m.cmdPatchScene(sid, map[string]any{"notes": text}, "Scene notes saved")
	case overlayQuickNotes:
		m.notesText = text
		m.notesInput.SetValue(text)
		m.closeTextareaOverlay(true)
		return m, m.cmdSaveNotes()
	default:
		return m, nil
	}
}

func (m *Model) handleSceneSwitchKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "ctrl+c":
		return m, tea.Quit
	case "esc":
		m.switchInput.Blur()
		m.overlay = overlayNone
		m.status = ""
		return m, nil
	case "enter":
		if m.switchCursor < 0 || m.switchCursor >= len(m.switchRows) {
			return m, nil
		}
		sid := m.switchRows[m.switchCursor].ID
		m.switchInput.Blur()
		m.overlay = overlayNone
		m.status = "Loading scene…"
		return m, tea.Batch(
			m.cmdLoadSceneByID(sid),
			m.cmdPatchScene(sid, map[string]any{"status": "current"}, "Scene set current"),
		)
	case "up":
		if len(m.switchRows) > 0 {
			m.switchCursor = clampIndex(m.switchCursor-1, len(m.switchRows))
		}
		return m, nil
	case "down":
		if len(m.switchRows) > 0 {
			m.switchCursor = clampIndex(m.switchCursor+1, len(m.switchRows))
		}
		return m, nil
	}
	var cmd tea.Cmd
	m.switchInput, cmd = updateFocusedInput(m.switchInput, msg)
	m.rebuildSceneSwitcher()
	return m, cmd
}

func (m *Model) handleClockKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	if m.clockExact {
		switch msg.String() {
		case "esc":
			m.clockExact = false
			m.editInput.Blur()
			return m, nil
		case "enter":
			raw := m.editInput.Value()
			m.clockExact = false
			m.editInput.Blur()
			min, err := ParseClockHM(raw)
			if err != nil {
				m.errMsg = err.Error()
				return m, nil
			}
			m.clock = NormalizeClock(m.clock.Day, min)
			return m, m.cmdSaveClock()
		case "ctrl+c":
			return m, tea.Quit
		}
		var cmd tea.Cmd
		m.editInput, cmd = updateFocusedInput(m.editInput, msg)
		return m, cmd
	}
	switch msg.String() {
	case "esc":
		m.clockFocus = false
		m.status = ""
		return m, nil
	case "left":
		m.clock = AdjustClockMinutes(m.clock, -10)
		return m, m.cmdSaveClock()
	case "right":
		m.clock = AdjustClockMinutes(m.clock, 10)
		return m, m.cmdSaveClock()
	case "shift+left":
		m.clock = AdjustClockMinutes(m.clock, -60)
		return m, m.cmdSaveClock()
	case "shift+right":
		m.clock = AdjustClockMinutes(m.clock, 60)
		return m, m.cmdSaveClock()
	case "up":
		m.clock = AdjustClockDay(m.clock, 1)
		return m, m.cmdSaveClock()
	case "down":
		m.clock = AdjustClockDay(m.clock, -1)
		return m, m.cmdSaveClock()
	case "enter":
		m.clockExact = true
		m.editInput.Placeholder = "HH:MM"
		hh := m.clock.Minute / 60
		mm := m.clock.Minute % 60
		m.editInput.SetValue(fmt.Sprintf("%02d:%02d", hh, mm))
		m.editInput.Focus()
		return m, textinput.Blink
	case "ctrl+c":
		return m, tea.Quit
	}
	return m, nil
}

func (m *Model) cmdPatchScene(sceneID string, patch map[string]any, statusMsg string) tea.Cmd {
	if sceneID == "" || m.campaignID == "" {
		return nil
	}
	client := m.client
	campaign := m.campaignID
	_, reload := patch["content"]
	return func() tea.Msg {
		detail, err := client.PatchScene(campaign, sceneID, patch)
		return scenePatchedMsg{detail: detail, statusMsg: statusMsg, reload: reload, err: err}
	}
}

func (m *Model) cmdSaveClock() tea.Cmd {
	client := m.client
	campaign := m.campaignID
	clock := m.clock
	return func() tea.Msg {
		_, err := client.PatchDocument(campaign, "campaign-state", map[string]any{
			"clock": map[string]any{"day": clock.Day, "minute": clock.Minute},
		})
		return clockSavedMsg{clock: clock, statusMsg: "Clock " + FormatClockCompact(clock), err: err}
	}
}

func (m *Model) applyScenePatchLocal(detail *api.SceneDetail) {
	if detail == nil {
		return
	}
	if m.sceneDetail != nil && m.sceneDetail.ID == detail.ID {
		m.sceneDetail = detail
	}
	if m.sceneList == nil {
		return
	}
	for i := range m.sceneList.Scenes {
		if m.sceneList.Scenes[i].ID == detail.ID {
			m.sceneList.Scenes[i].Status = detail.Status
			m.sceneList.Scenes[i].Title = detail.Title
			m.sceneList.Scenes[i].GroupID = detail.GroupID
			m.sceneList.Scenes[i].LocationID = detail.LocationID
		} else if detail.Status == "current" && m.sceneList.Scenes[i].Status == "current" {
			m.sceneList.Scenes[i].Status = "completed"
		}
	}
	if detail.Status == "current" {
		m.sceneList.CurrentSceneID = detail.ID
	}
}

func (m *Model) cycleFocusedSceneStatus(delta int) tea.Cmd {
	scenes := m.filteredScenes()
	if m.sceneListCursor < 0 || m.sceneListCursor >= len(scenes) {
		return nil
	}
	s := scenes[m.sceneListCursor]
	next := NextSceneStatus(s.Status, delta)
	return m.cmdPatchScene(s.ID, map[string]any{"status": next}, "Status → "+next)
}

func (m *Model) handleAdjust(delta int) (tea.Model, tea.Cmd) {
	if m.screen != screenCampaign {
		return m, nil
	}
	if m.overlay == overlayCharSheet {
		return m.adjustSheetRow(delta)
	}
	if m.overlay != overlayNone {
		return m, nil
	}
	switch m.tab {
	case tabScene:
		if m.scenePane == scenePaneNav {
			return m, m.cycleFocusedSceneStatus(signOnly(delta))
		}
		if m.scenePane == scenePaneParty {
			return m.adjustPartyEntity(delta)
		}
	case tabParty:
		return m.adjustPartyEntity(delta)
	case tabMusic:
		step := 5.0
		if delta > 1 || delta < -1 {
			step = float64(delta) // large already ±5
		} else {
			step = float64(delta) * 5
		}
		m.musicVol = minf(100, maxf(0, m.musicVol+step))
		_ = m.player.SetVolume(m.musicVol)
		m.status = fmt.Sprintf("Volume %.0f", m.musicVol)
		return m, nil
	}
	return m, nil
}

func signOnly(delta int) int {
	if delta < 0 {
		return -1
	}
	if delta > 0 {
		return 1
	}
	return 0
}

func (m *Model) adjustPartyEntity(delta int) (tea.Model, tea.Cmd) {
	if m.tab == tabScene && m.scenePane == scenePaneParty {
		pcs := m.partyPCEntities()
		if m.scenePartyCursor >= 0 && m.scenePartyCursor < len(pcs) {
			pc := pcs[m.scenePartyCursor]
			for i, e := range m.snap.Entities {
				if e.Key == pc.Key {
					m.selected = i
					break
				}
			}
		}
	}
	e := m.selectedEntity()
	if e == nil || !e.EditableHP {
		return m, nil
	}
	raw := fmt.Sprintf("%+d", delta)
	m.status = fmt.Sprintf("HP %+d…", delta)
	return m, m.cmdMutate(editHP, raw)
}

func (m *Model) adjustSheetRow(delta int) (tea.Model, tea.Cmd) {
	if m.sheetCursor < 0 || m.sheetCursor >= len(m.sheetRows) {
		return m, nil
	}
	row := m.sheetRows[m.sheetCursor]
	e := m.selectedEntity()
	switch row.Kind {
	case sheetRowHP:
		if e == nil || !e.EditableHP {
			return m, nil
		}
		m.status = fmt.Sprintf("HP %+d…", delta)
		return m, m.cmdMutate(editHP, fmt.Sprintf("%+d", delta))
	case sheetRowAC:
		if e == nil || !e.EditableAC {
			return m, nil
		}
		cur := 10
		if e.AC != nil {
			cur = int(*e.AC)
		}
		next := AdjustInt(cur, delta, 0, 40)
		m.status = fmt.Sprintf("AC %d", next)
		return m, m.cmdMutate(editAC, trimNum(float64(next)))
	case sheetRowInit:
		cur := 0
		if e != nil {
			cur = int(e.Initiative)
		}
		next := AdjustInt(cur, delta, -20, 40)
		m.status = fmt.Sprintf("Init %d", next)
		return m, m.cmdMutate(editInit, trimNum(float64(next)))
	default:
		return m, nil
	}
}

func (m *Model) rebuildSheetRows() {
	if m.sheetChar == nil || len(m.sheetChar.Sheet) == 0 {
		m.sheetRows = nil
		m.sheetLinks = nil
		return
	}
	var sheet map[string]any
	if err := json.Unmarshal(m.sheetChar.Sheet, &sheet); err != nil {
		m.sheetRows = nil
		return
	}
	init := 0.0
	cond := ""
	if e := m.selectedEntity(); e != nil {
		init = e.Initiative
		cond = e.Conditions
	}
	m.sheetRows = BuildSheetRows(sheet, m.sheetState, init, cond)
	m.sheetCursor = clampIndex(m.sheetCursor, len(m.sheetRows))
	// Keep legacy link slice for any callers; prefer sheetRows.
	m.sheetLinks = nil
	for _, r := range m.sheetRows {
		if r.Kind == sheetRowLink && r.Type != "" && r.ID != "" {
			m.sheetLinks = append(m.sheetLinks, sheetLink{Label: r.Label, Type: r.Type, ID: r.ID})
		}
	}
}

func (m *Model) selectedSheetRow() *SheetRow {
	if m.sheetCursor < 0 || m.sheetCursor >= len(m.sheetRows) {
		return nil
	}
	return &m.sheetRows[m.sheetCursor]
}

func (m *Model) viewSceneEditOverlay() string {
	title := "SCENE"
	if m.sceneDetail != nil {
		if t := strings.TrimSpace(m.sceneDetail.Title); t != "" {
			title = strings.ToUpper(t)
		} else {
			title = m.sceneDetail.ID
		}
	}
	hdr := AppTheme.Title.Render("EDIT SCENE · " + title)
	body := m.overlayTA.View()
	footer := HelpHints([][2]string{{"Ctrl+S", "save"}, {"Esc", "cancel"}})
	inner := lipgloss.JoinVertical(lipgloss.Left, hdr, "", body, "", footer)
	if m.errMsg != "" {
		inner += "\n" + errStyle.Render(m.errMsg)
	}
	w := max(40, m.width-4)
	return AppTheme.Chrome.Width(w - AppTheme.Chrome.GetHorizontalFrameSize()).Render(inner)
}

func (m *Model) viewSceneNoteOverlay() string {
	title := "SCENE NOTES"
	if m.sceneDetail != nil && m.sceneDetail.Title != "" {
		title = "NOTES · " + strings.ToUpper(m.sceneDetail.Title)
	}
	hdr := AppTheme.Title.Render(title)
	body := m.overlayTA.View()
	footer := HelpHints([][2]string{{"Ctrl+S", "save"}, {"Esc", "cancel"}})
	inner := lipgloss.JoinVertical(lipgloss.Left, hdr, "", body, "", footer)
	w := max(40, m.width-4)
	return AppTheme.Chrome.Width(w - AppTheme.Chrome.GetHorizontalFrameSize()).Render(inner)
}

func (m *Model) viewQuickNotesOverlay() string {
	hdr := AppTheme.Title.Render("QUICK NOTES")
	body := m.overlayTA.View()
	footer := HelpHints([][2]string{{"Ctrl+S", "save"}, {"Esc", "cancel"}})
	inner := lipgloss.JoinVertical(lipgloss.Left, hdr, "", body, "", footer)
	w := max(40, m.width-4)
	return AppTheme.Chrome.Width(w - AppTheme.Chrome.GetHorizontalFrameSize()).Render(inner)
}

func (m *Model) viewSceneSwitchOverlay() string {
	var b strings.Builder
	b.WriteString(AppTheme.Title.Render("SWITCH SCENE"))
	b.WriteString("\n")
	b.WriteString("Filter: ")
	b.WriteString(m.switchInput.View())
	b.WriteString("\n\n")
	if len(m.switchRows) == 0 {
		b.WriteString(AppTheme.Muted.Render("(no matches)"))
	} else {
		viewport := max(5, m.height-12)
		start := EnsureVisibleScroll(0, m.switchCursor, viewport, len(m.switchRows))
		end := min(len(m.switchRows), start+viewport)
		for i := start; i < end; i++ {
			s := m.switchRows[i]
			label := fmt.Sprintf("%s [%s]", s.Title, s.Status)
			if s.Title == "" {
				label = s.ID + " [" + s.Status + "]"
			}
			line := "  " + TruncateVisible(label, max(20, m.width-8))
			if i == m.switchCursor {
				line = AppTheme.Selection.Render("▶ " + TruncateVisible(label, max(18, m.width-10)))
			}
			b.WriteString(line)
			b.WriteByte('\n')
		}
	}
	b.WriteString("\n")
	b.WriteString(HelpHints([][2]string{{"Enter", "open+current"}, {"Esc", "cancel"}, {"↑↓", "select"}}))
	return b.String()
}