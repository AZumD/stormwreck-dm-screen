package ui

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/api"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/layout"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/model"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/scene"
)

func (m *Model) viewLogin() string {
	var b strings.Builder
	b.WriteString(titleStyle.Render("Stormwreck DM — Terminal"))
	b.WriteString("\n")
	b.WriteString(dimStyle.Render("Tracker client · server is canonical · scene-first IA"))
	b.WriteString("\n\n")
	b.WriteString(fmt.Sprintf("Server: %s\n", m.cfg.ServerURL))
	if m.cfg.CampaignID != "" {
		b.WriteString(fmt.Sprintf("Campaign shortcut: %s\n", m.cfg.CampaignID))
	}
	b.WriteString("\nEmail:\n")
	b.WriteString(m.emailInput.View())
	b.WriteString("\n\nPassword:\n")
	b.WriteString(m.passInput.View())
	b.WriteString("\n\n")
	b.WriteString(dimStyle.Render("Enter sign in · Tab switch field · Ctrl+C quit"))
	if m.errMsg != "" {
		b.WriteString("\n\n")
		b.WriteString(errStyle.Render(m.errMsg))
	}
	if m.conn == connConnecting {
		b.WriteString("\n\nConnecting…")
	}
	return b.String()
}

func (m *Model) viewHome() string {
	var b strings.Builder
	b.WriteString(titleStyle.Render("Home"))
	b.WriteString(dimStyle.Render(fmt.Sprintf("  %s", m.cfg.ServerURL)))
	b.WriteString("\n")
	if m.searching {
		b.WriteString("Filter: ")
		b.WriteString(m.searchInput.View())
		b.WriteString("\n")
	}
	b.WriteString("\n")
	b.WriteString(titleStyle.Render("LIBRARY"))
	b.WriteString("\n")
	libShown := false
	campHeader := false
	for i, row := range m.homeRows {
		if row.Kind == "campaign" && !campHeader {
			b.WriteString("\n")
			b.WriteString(titleStyle.Render("CAMPAIGNS"))
			b.WriteString("\n")
			campHeader = true
		}
		if row.Kind == "library" {
			libShown = true
		}
		line := "  " + row.Label
		if row.Kind == "campaign" {
			line = "  " + row.Label
			if row.ID != row.Label {
				line += dimStyle.Render(" (" + row.ID + ")")
			}
		}
		if i == m.homeCursor {
			line = selStyle.Render("▶ " + strings.TrimPrefix(line, "  "))
		}
		b.WriteString(line)
		b.WriteByte('\n')
	}
	if !libShown && len(m.catalogueTypes) == 0 {
		b.WriteString(dimStyle.Render("  (no catalogue types)"))
		b.WriteByte('\n')
	}
	if !campHeader {
		b.WriteString("\n")
		b.WriteString(titleStyle.Render("CAMPAIGNS"))
		b.WriteString("\n")
		b.WriteString(dimStyle.Render("  (none)"))
		b.WriteByte('\n')
	}
	b.WriteString("\n")
	b.WriteString(dimStyle.Render("/ search · Enter open · q quit"))
	if m.errMsg != "" {
		b.WriteString("\n")
		b.WriteString(errStyle.Render(m.errMsg))
	}
	return b.String()
}

func (m *Model) viewLibraryList() string {
	mainW, inspW, mainH, inspH := layout.PaneSizes(m.width, m.height-4)
	ents := m.filteredLibEntries()
	var list strings.Builder
	hdr := CatalogueTypeTitle(m.libType)
	if m.overlay == overlayLibrary {
		hdr = "Library · " + hdr
	}
	list.WriteString(titleStyle.Render(hdr))
	list.WriteString("\n")
	if m.searching {
		list.WriteString("Filter: ")
		list.WriteString(m.searchInput.View())
		list.WriteString("\n")
	}
	if m.libType == "" {
		// type picker inside campaign library overlay
		types := FilterCatalogueTypes(m.catalogueTypes, m.searchInput.Value())
		for i, t := range types {
			line := "  " + CatalogueTypeTitle(t)
			if i == m.homeCursor {
				line = selStyle.Render("▶ " + CatalogueTypeTitle(t))
			}
			list.WriteString(line)
			list.WriteByte('\n')
		}
	} else {
		for i, e := range ents {
			name := strField(e, "name", "title")
			if name == "" {
				name = strField(e, "id")
			}
			line := "  " + truncate(name, max(12, mainW-4))
			if i == m.libCursor {
				line = selStyle.Render("▶ " + truncate(name, max(12, mainW-6)))
			}
			list.WriteString(line)
			list.WriteByte('\n')
		}
		if len(ents) == 0 {
			list.WriteString(dimStyle.Render("  (empty)"))
			list.WriteByte('\n')
		}
	}
	insp := "(nothing selected)"
	if m.libType != "" && m.libCursor >= 0 && m.libCursor < len(ents) {
		insp = FormatInspector(ents[m.libCursor], m.libType)
	}
	body := m.splitPanes(list.String(), insp, mainW, inspW, mainH, inspH)
	footer := dimStyle.Render("↑↓ select · Enter detail · Esc back · / search")
	if m.errMsg != "" {
		return body + "\n" + errStyle.Render(m.errMsg) + "\n" + footer
	}
	return body + "\n" + footer
}

func (m *Model) viewCatalogueDetail() string {
	var b strings.Builder
	b.WriteString(titleStyle.Render("Catalogue · " + CatalogueTypeTitle(m.libDetailT)))
	b.WriteString("\n\n")
	b.WriteString(FormatInspector(m.libDetail, m.libDetailT))
	b.WriteString("\n\n")
	if m.libDetail != nil {
		// dump remaining string fields lightly
		for k, v := range m.libDetail {
			switch k {
			case "id", "name", "title", "summary", "description", "notes", "ac", "hp", "level", "cr", "type", "category", "rarity", "size", "alignment", "speed", "challenge":
				continue
			}
			if s, ok := v.(string); ok && strings.TrimSpace(s) != "" {
				b.WriteString(k)
				b.WriteString(": ")
				b.WriteString(truncate(s, 120))
				b.WriteByte('\n')
			}
		}
	}
	b.WriteString("\n")
	b.WriteString(dimStyle.Render("Esc back"))
	if m.errMsg != "" {
		b.WriteString("\n")
		b.WriteString(errStyle.Render(m.errMsg))
	}
	return b.String()
}

func (m *Model) viewCampaign() string {
	header := m.campaignChrome()
	main := ""
	switch m.tab {
	case tabScene:
		main = m.viewSceneTab()
	case tabNotes:
		main = m.viewNotesTab()
	case tabParty:
		main = m.viewPartyTab()
	case tabMap:
		main = m.viewMapTab()
	case tabMusic:
		main = m.viewMusicTab()
	}
	status := m.statusBar()
	hints := m.footerHints()
	parts := []string{header, main, status, hints}
	if m.errMsg != "" {
		parts = append(parts, errStyle.Render(m.errMsg))
	}
	return strings.Join(parts, "\n")
}

func (m *Model) campaignChrome() string {
	tabs := []string{"1 Scene", "2 Notes", "3 Party", "4 Map", "5 Music"}
	var rendered []string
	for i, t := range tabs {
		if campaignTab(i) == m.tab {
			rendered = append(rendered, tabOnStyle.Render(t))
		} else {
			rendered = append(rendered, dimStyle.Render(t))
		}
	}
	title := m.campaignTitle
	if title == "" {
		title = m.campaignID
	}
	conn := m.connLabel()
	return titleStyle.Render(title) + "  " + dimStyle.Render("["+conn+"]") + "\n" + strings.Join(rendered, "  ")
}

func (m *Model) connLabel() string {
	switch m.conn {
	case connConnected:
		return "connected"
	case connRefreshing:
		return "refreshing"
	case connError:
		if m.stale {
			return "error · STALE"
		}
		return "error"
	case connConnecting:
		return "connecting"
	default:
		return "offline"
	}
}

func (m *Model) statusBar() string {
	parts := []string{}
	if e := m.selectedEntity(); e != nil && (m.tab == tabParty || m.tab == tabMap) {
		parts = append(parts, fmt.Sprintf("%s HP %s AC %s",
			truncate(e.Name, 16),
			model.FormatHP(e.HPCurrent, e.HPMax),
			fmtAC(e.AC),
		))
	}
	if m.player != nil && m.player.IsPlaying() {
		parts = append(parts, "♪ playing")
	} else if m.nowPlaying != "" {
		parts = append(parts, "♪ "+truncate(m.nowPlaying, 20))
	}
	if len(parts) == 0 {
		return dimStyle.Render("—")
	}
	return dimStyle.Render(strings.Join(parts, " · "))
}

func (m *Model) footerHints() string {
	if m.edit != editNone {
		return m.editInput.View() + "  (Enter save · Esc cancel)"
	}
	base := "Ctrl+H home · Ctrl+L library · Esc back · q quit"
	switch m.tab {
	case tabScene:
		return dimStyle.Render("↑↓ refs · Enter follow · " + base)
	case tabNotes:
		return dimStyle.Render("Shift+N edit · Enter save · " + base)
	case tabParty:
		return dimStyle.Render("↑↓ · Enter sheet · h/i/c/a edit · " + base)
	case tabMap:
		return dimStyle.Render("↑↓ select · " + base)
	case tabMusic:
		return dimStyle.Render("Space play · +/- vol · L loop · S stop · " + base)
	default:
		return dimStyle.Render(base)
	}
}

func (m *Model) viewSceneTab() string {
	var b strings.Builder
	title := "(no scene)"
	if m.sceneDetail != nil {
		title = m.sceneDetail.Title
		if title == "" {
			title = m.sceneDetail.ID
		}
	} else if m.sceneList != nil && m.sceneList.CurrentSceneID != "" {
		title = m.sceneList.CurrentSceneID
	}
	b.WriteString(titleStyle.Render(title))
	b.WriteString("\n\n")
	if len(m.sceneBlocks) > 0 {
		b.WriteString(scene.FormatBlocks(m.sceneBlocks))
	} else {
		b.WriteString(dimStyle.Render("(empty scene content)"))
	}
	if len(m.sceneRefs) > 0 {
		b.WriteString("\n\n")
		b.WriteString(titleStyle.Render("Refs"))
		b.WriteString("\n")
		for i, r := range m.sceneRefs {
			label := r.Label
			if label == "" {
				label = r.ID
			}
			line := fmt.Sprintf("  @%s:%s %s", r.Type, r.ID, label)
			if i == m.sceneRefSel {
				line = selStyle.Render("▶ " + strings.TrimPrefix(line, "  "))
			}
			b.WriteString(line)
			b.WriteByte('\n')
		}
	}
	return b.String()
}

func (m *Model) viewNotesTab() string {
	var b strings.Builder
	b.WriteString(titleStyle.Render("Notes"))
	b.WriteString("\n\n")
	if m.editingNotes {
		b.WriteString(m.notesInput.View())
	} else {
		t := m.notesText
		if strings.TrimSpace(t) == "" {
			t = "(empty — Shift+N to edit)"
			b.WriteString(dimStyle.Render(t))
		} else {
			b.WriteString(t)
		}
	}
	return b.String()
}

func (m *Model) viewPartyTab() string {
	mainW, inspW, mainH, inspH := layout.PaneSizes(m.width, m.height-8)
	var table strings.Builder
	table.WriteString(fmt.Sprintf("%-4s %-14s %-9s %-4s %-4s %s\n", "INIT", "NAME", "HP", "AC", "PP", "KIND"))
	for i, e := range m.snap.Entities {
		init := "—"
		if e.Initiative != 0 {
			init = trimNum(e.Initiative)
		}
		ac := "—"
		if e.AC != nil {
			ac = trimNum(*e.AC)
		}
		pp := "—"
		if e.PP != nil {
			pp = trimNum(*e.PP)
		}
		line := fmt.Sprintf("%-4s %-14s %-9s %-4s %-4s %s",
			init, truncate(e.Name, 14), model.FormatHP(e.HPCurrent, e.HPMax), ac, pp, e.Kind)
		if i == m.selected {
			line = selStyle.Render("▶ " + line)
		} else {
			line = "  " + line
		}
		table.WriteString(line)
		table.WriteByte('\n')
	}
	if len(m.snap.Entities) == 0 {
		table.WriteString(dimStyle.Render("  (no party / tokens / initiative yet)"))
		table.WriteByte('\n')
	}
	detail := m.partyInspector()
	return m.splitPanes(table.String(), detail, mainW, inspW, mainH, inspH)
}

func (m *Model) partyInspector() string {
	e := m.selectedEntity()
	if e == nil {
		return "(nothing selected)"
	}
	return fmt.Sprintf("%s [%s]\nHP %s  AC %s  PP %s  Init %s\nConditions: %s\nFlags: hp=%v ac=%v cond=%v",
		e.Name, e.Kind,
		model.FormatHP(e.HPCurrent, e.HPMax),
		fmtAC(e.AC), fmtAC(e.PP),
		fmtInit(e.Initiative),
		emptyDash(e.Conditions),
		e.EditableHP, e.EditableAC, e.EditableCond,
	)
}

func (m *Model) viewMapTab() string {
	mapH := max(8, m.height-10)
	mapW := max(20, m.width-4)
	mapView := projectASCII(mapW, mapH, m.snap, m.selectedKey())
	var b strings.Builder
	b.WriteString(fmt.Sprintf("map:%s", m.snap.ActiveMap))
	if m.snap.MapTitle != "" {
		b.WriteString(" (" + m.snap.MapTitle + ")")
	}
	b.WriteString("\n")
	b.WriteString(boxStyle.Width(m.width - 2).Render(mapView))
	if e := m.selectedEntity(); e != nil {
		b.WriteString("\n")
		b.WriteString(dimStyle.Render(fmt.Sprintf("%s · HP %s AC %s", e.Name, model.FormatHP(e.HPCurrent, e.HPMax), fmtAC(e.AC))))
	}
	return b.String()
}

func (m *Model) viewMusicTab() string {
	var b strings.Builder
	b.WriteString(titleStyle.Render("Music"))
	b.WriteString(dimStyle.Render(fmt.Sprintf("  vol %.0f", m.musicVol)))
	if m.musicLoop {
		b.WriteString(dimStyle.Render("  loop"))
	}
	if !m.player.Available() {
		b.WriteString("\n")
		b.WriteString(errStyle.Render("mpv not found — browsing only (install mpv for playback)"))
	}
	b.WriteString("\n\n")
	if len(m.musicTracks) == 0 {
		b.WriteString(dimStyle.Render("(no tracks in music-mixer — add via browser DM)"))
		return b.String()
	}
	for i, t := range m.musicTracks {
		mark := "  "
		line := fmt.Sprintf("%s%s", mark, t.Title)
		if i == m.musicCursor {
			line = selStyle.Render("▶ " + t.Title)
		}
		if m.player.IsPlaying() && strings.Contains(m.player.CurrentURL(), t.CatalogueMusicID) {
			line += dimStyle.Render(" ♪")
		}
		b.WriteString(line)
		b.WriteByte('\n')
	}
	return b.String()
}

func (m *Model) viewCharSheet() string {
	var b strings.Builder
	name := "Character"
	if m.sheetChar != nil {
		name = m.sheetChar.Name
	}
	b.WriteString(titleStyle.Render(name + " — Sheet"))
	b.WriteString("\n\n")
	if m.sheetState != nil {
		b.WriteString(fmt.Sprintf("HP %s", model.FormatHP(m.sheetState.HPCurrent, m.sheetState.HPMax)))
		b.WriteString("\n")
	}
	if m.sheetChar != nil && len(m.sheetChar.Sheet) > 0 {
		var sheet map[string]any
		if json.Unmarshal(m.sheetChar.Sheet, &sheet) == nil {
			b.WriteString(FormatInspector(sheet, "pc"))
			b.WriteString("\n")
		}
	}
	if len(m.sheetLinks) > 0 {
		b.WriteString("\n")
		b.WriteString(titleStyle.Render("Refs"))
		b.WriteString("\n")
		for i, l := range m.sheetLinks {
			line := "  " + l.Label
			if i == m.sheetCursor {
				line = selStyle.Render("▶ " + l.Label)
			}
			b.WriteString(line)
			b.WriteByte('\n')
		}
	}
	b.WriteString("\n")
	b.WriteString(dimStyle.Render("Enter follow · Esc back · h/i/c/a edit party vitals"))
	return b.String()
}

func (m *Model) splitPanes(main, insp string, mainW, inspW, mainH, inspH int) string {
	mode := layout.Detect(m.width)
	if mode == layout.ModeWide {
		left := boxStyle.Width(max(10, mainW-2)).Height(max(4, mainH-2)).Render(main)
		right := boxStyle.Width(max(10, inspW-2)).Height(max(4, inspH-2)).Render(insp)
		// simple side-by-side without lipgloss JoinHorizontal dependency issues
		leftLines := strings.Split(left, "\n")
		rightLines := strings.Split(right, "\n")
		n := max(len(leftLines), len(rightLines))
		var b strings.Builder
		for i := 0; i < n; i++ {
			l, r := "", ""
			if i < len(leftLines) {
				l = leftLines[i]
			}
			if i < len(rightLines) {
				r = rightLines[i]
			}
			b.WriteString(l)
			// pad
			pad := mainW - lipglossWidth(l)
			if pad < 1 {
				pad = 1
			}
			b.WriteString(strings.Repeat(" ", pad))
			b.WriteString(r)
			b.WriteByte('\n')
		}
		return strings.TrimRight(b.String(), "\n")
	}
	return boxStyle.Width(m.width-2).Render(main) + "\n" + boxStyle.Width(m.width-2).Render(insp)
}

func lipglossWidth(s string) int {
	return len([]rune(strings.Split(s, "\n")[0]))
}

func buildSheetLinks(ch *api.Character) []sheetLink {
	if ch == nil || len(ch.Sheet) == 0 {
		return nil
	}
	var sheet map[string]any
	if err := json.Unmarshal(ch.Sheet, &sheet); err != nil {
		return nil
	}
	var out []sheetLink
	for _, key := range []string{"inventory", "equipment", "spells", "features", "skills"} {
		arr, ok := sheet[key].([]any)
		if !ok {
			continue
		}
		for _, item := range arr {
			switch t := item.(type) {
			case string:
				// maybe "type:id" or bare id
				if strings.Contains(t, ":") {
					parts := strings.SplitN(t, ":", 2)
					out = append(out, sheetLink{Label: key + ": " + t, Type: parts[0], ID: parts[1]})
				}
			case map[string]any:
				id := strField(t, "id", "catalogueId")
				typ := strField(t, "type", "catalogueType")
				name := strField(t, "name", "title", "label")
				if typ == "" {
					switch key {
					case "spells":
						typ = "spell"
					case "features":
						typ = "feature"
					case "skills":
						typ = "skill"
					default:
						typ = "item"
					}
				}
				if id == "" {
					continue
				}
				if name == "" {
					name = id
				}
				out = append(out, sheetLink{Label: key + ": " + name, Type: typ, ID: id})
			}
		}
	}
	return out
}
