package ui

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/api"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/layout"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/model"
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
	b.WriteString(FormatCatalogueDetail(m.libDetail, m.libDetailT))
	if len(m.detailLinks) > 0 {
		b.WriteString("\n\n")
		b.WriteString(titleStyle.Render("Linked"))
		b.WriteString("\n")
		for i, l := range m.detailLinks {
			line := "  " + l.Label
			if i == m.detailCursor {
				line = selStyle.Render("▶ " + l.Label)
			}
			b.WriteString(line)
			b.WriteByte('\n')
		}
	}
	b.WriteString("\n")
	b.WriteString(dimStyle.Render("↑↓ links · Enter follow · Esc back"))
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
	title := m.campaignTitle
	if title == "" {
		title = m.campaignID
	}
	title = strings.ToUpper(strings.TrimSpace(title))
	if title == "" {
		title = "CAMPAIGN"
	}

	conn := m.connLabel()
	var connStyled string
	switch m.conn {
	case connConnected, connRefreshing:
		connStyled = AppTheme.ConnOK.Render("● " + strings.ToUpper(conn))
	case connError, connUnauthorized:
		connStyled = AppTheme.ConnErr.Render("● " + strings.ToUpper(conn))
	default:
		connStyled = AppTheme.ConnWarn.Render("● " + strings.ToUpper(conn))
	}

	tabs := []string{"1 SCENE", "2 NOTES", "3 PARTY", "4 MAP", "5 MUSIC"}
	var rendered []string
	for i, t := range tabs {
		if campaignTab(i) == m.tab {
			rendered = append(rendered, AppTheme.TabActive.Render(t))
		} else {
			rendered = append(rendered, AppTheme.TabInactive.Render(t))
		}
	}

	w := max(40, m.width-2)
	hFrame := AppTheme.Chrome.GetHorizontalFrameSize()
	innerW := w - hFrame
	if innerW < 20 {
		innerW = 20
	}

	headLeft := AppTheme.Title.Render(TruncateVisible(title, max(8, innerW-lipgloss.Width(connStyled)-3)))
	head := lipgloss.JoinHorizontal(lipgloss.Top, headLeft, "  ", connStyled)
	tabRow := strings.Join(rendered, "   ")
	inner := lipgloss.JoinVertical(lipgloss.Left, head, tabRow)
	return AppTheme.Chrome.Width(innerW).Render(inner)
}

func (m *Model) connLabel() string {
	switch m.conn {
	case connConnected:
		return "connected"
	case connRefreshing:
		return "refreshing"
	case connError:
		if m.stale {
			return "stale"
		}
		return "error"
	case connConnecting:
		return "connecting"
	case connUnauthorized:
		return "auth"
	default:
		return "offline"
	}
}

func (m *Model) statusBar() string {
	parts := []string{}
	if e := m.selectedEntity(); e != nil && (m.tab == tabParty || m.tab == tabMap) {
		parts = append(parts, fmt.Sprintf("%s HP %s AC %s",
			TruncateVisible(e.Name, 16),
			model.FormatHP(e.HPCurrent, e.HPMax),
			fmtAC(e.AC),
		))
	}
	if m.player != nil && m.player.IsPlaying() {
		parts = append(parts, AppTheme.Success.Render("♪ playing"))
	} else if m.nowPlaying != "" {
		parts = append(parts, "♪ "+TruncateVisible(m.nowPlaying, 20))
	}
	if len(parts) == 0 {
		return AppTheme.Muted.Render("—")
	}
	return AppTheme.Muted.Render(strings.Join(parts, " · "))
}

func (m *Model) footerHints() string {
	if m.edit != editNone {
		return m.editInput.View() + "  " + HelpHints([][2]string{{"Enter", "save"}, {"Esc", "cancel"}})
	}
	base := [][2]string{{"Ctrl+H", "home"}, {"Ctrl+L", "library"}, {"Esc", "back"}, {"q", "quit"}}
	var pairs [][2]string
	switch m.tab {
	case tabScene:
		pairs = append([][2]string{
			{"Tab", "panes"},
			{"j/k", "scroll"},
			{"[/]", "refs"},
			{"Enter", "open"},
			{"/", "search"},
		}, base...)
	case tabNotes:
		pairs = append([][2]string{{"Shift+N", "edit"}, {"Enter", "save"}}, base...)
	case tabParty:
		pairs = append([][2]string{{"↑↓", "select"}, {"Enter", "sheet"}, {"h/i/c/a", "edit"}}, base...)
	case tabMap:
		pairs = append([][2]string{{"↑↓", "select"}}, base...)
	case tabMusic:
		pairs = append([][2]string{{"Space", "play"}, {"+/-", "vol"}, {"L", "loop"}, {"S", "stop"}}, base...)
	default:
		pairs = base
	}
	return HelpHints(pairs)
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
	if m.sheetChar != nil && len(m.sheetChar.Sheet) > 0 {
		var sheet map[string]any
		if json.Unmarshal(m.sheetChar.Sheet, &sheet) == nil {
			b.WriteString(FormatPCSheet(sheet, m.sheetState))
			b.WriteString("\n")
		}
	} else if m.sheetState != nil {
		b.WriteString(fmt.Sprintf("HP %s\n", model.FormatHP(m.sheetState.HPCurrent, m.sheetState.HPMax)))
	}
	if len(m.sheetLinks) > 0 {
		b.WriteString("\n")
		b.WriteString(titleStyle.Render("Linked"))
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
		left := RenderPane("MAIN", main, mainW, mainH, true)
		right := RenderPane("SELECTED", insp, inspW, inspH, false)
		return lipgloss.JoinHorizontal(lipgloss.Top, left, " ", right)
	}
	top := RenderPane("MAIN", main, m.width, mainH, true)
	bot := RenderPane("SELECTED", insp, m.width, inspH, false)
	return lipgloss.JoinVertical(lipgloss.Left, top, bot)
}

func buildSheetLinks(ch *api.Character) []sheetLink {
	if ch == nil || len(ch.Sheet) == 0 {
		return nil
	}
	var sheet map[string]any
	if err := json.Unmarshal(ch.Sheet, &sheet); err != nil {
		return nil
	}
	return buildEntryLinks(sheet, "pc")
}

func buildEntryLinks(entry map[string]any, typ string) []sheetLink {
	if entry == nil {
		return nil
	}
	keys := []string{"equipment", "inventory", "skillRefs", "skills", "featureRefs", "features", "spellRefs", "spells"}
	if strings.EqualFold(typ, "source") {
		// chapters are content, not catalogue links
		keys = nil
	}
	var out []sheetLink
	seen := map[string]bool{}
	for _, key := range keys {
		v, ok := entry[key]
		if !ok || v == nil {
			continue
		}
		switch t := v.(type) {
		case string:
			appendRefLink(&out, seen, key, t)
		case []any:
			for _, item := range t {
				switch it := item.(type) {
				case string:
					appendRefLink(&out, seen, key, it)
				case map[string]any:
					id := strField(it, "id", "catalogueId")
					linkType := strField(it, "type", "catalogueType")
					name := strField(it, "name", "title", "label")
					if linkType == "" {
						linkType = defaultLinkType(key)
					}
					if id == "" {
						continue
					}
					sk := linkType + ":" + id
					if seen[sk] {
						continue
					}
					seen[sk] = true
					if name == "" {
						name = id
					}
					out = append(out, sheetLink{Label: name, Type: linkType, ID: id})
				}
			}
		}
	}
	return out
}

func defaultLinkType(key string) string {
	switch key {
	case "spells", "spellRefs":
		return "spell"
	case "features", "featureRefs":
		return "feature"
	case "skills", "skillRefs":
		return "skill"
	default:
		return "item"
	}
}

func appendRefLink(out *[]sheetLink, seen map[string]bool, _key, raw string) {
	typ, id, label, ok := ParseCatalogueRef(raw)
	if !ok {
		return
	}
	sk := typ + ":" + id
	if seen[sk] {
		return
	}
	seen[sk] = true
	name := label
	if name == "" {
		name = id
	}
	*out = append(*out, sheetLink{Label: name, Type: typ, ID: id})
}
