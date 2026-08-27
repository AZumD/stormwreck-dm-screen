package ui

import (
	"strings"

	"github.com/charmbracelet/lipgloss"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/api"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/layout"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/model"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/scene"
)

// FilterSceneItems filters scenes by title/id (case-insensitive). Empty query → all.
func FilterSceneItems(scenes []api.SceneListItem, query string) []api.SceneListItem {
	q := strings.ToLower(strings.TrimSpace(query))
	if q == "" {
		return append([]api.SceneListItem(nil), scenes...)
	}
	var out []api.SceneListItem
	for _, s := range scenes {
		hay := strings.ToLower(s.Title + " " + s.ID)
		if strings.Contains(hay, q) {
			out = append(out, s)
		}
	}
	return out
}

func (m *Model) sceneQuery() string {
	if m.searching && m.screen == screenCampaign && m.tab == tabScene {
		return m.searchInput.Value()
	}
	return ""
}

func (m *Model) filteredScenes() []api.SceneListItem {
	if m.sceneList == nil {
		return nil
	}
	return FilterSceneItems(m.sceneList.Scenes, m.sceneQuery())
}

func (m *Model) partyPCEntities() []model.Entity {
	var out []model.Entity
	for _, e := range m.snap.Entities {
		if e.Kind == "pc" {
			out = append(out, e)
		}
	}
	return out
}

func (m *Model) syncSceneListCursor() {
	scenes := m.filteredScenes()
	if len(scenes) == 0 {
		m.sceneListCursor = 0
		return
	}
	curID := ""
	if m.sceneDetail != nil {
		curID = m.sceneDetail.ID
	} else if m.sceneList != nil {
		curID = m.sceneList.CurrentSceneID
	}
	if curID != "" {
		for i, s := range scenes {
			if s.ID == curID {
				m.sceneListCursor = i
				return
			}
		}
	}
	m.sceneListCursor = clampIndex(m.sceneListCursor, len(scenes))
}

func (m *Model) sceneWorkspaceSize() (w, h int) {
	w = max(40, m.width)
	// Reserve chrome + status + help (approx; exact clip happens in viewCampaign).
	h = max(8, m.height-6)
	return w, h
}

func (m *Model) viewSceneTab() string {
	w, h := m.sceneWorkspaceSize()
	mode := layout.DetectSceneMode(w)

	navInner := func(innerW int) string { return m.renderScrolledNav(innerW, h) }
	partyInner := m.renderScenePartyContent

	switch mode {
	case layout.SceneModeTriple:
		left, mid, right := layout.SceneColumns(w)
		g := layout.SceneGutter
		nav := RenderPane("SCENES", navInner(paneInnerWidth(left, m.scenePane == scenePaneNav)), left, h, m.scenePane == scenePaneNav)
		body := RenderPane(m.sceneBodyPaneTitle(), m.renderScrolledBody(paneInnerWidth(mid, m.scenePane == scenePaneBody), h), mid, h, m.scenePane == scenePaneBody)
		party := RenderPane("PARTY", partyInner(paneInnerWidth(right, m.scenePane == scenePaneParty)), right, h, m.scenePane == scenePaneParty)
		gap := strings.Repeat(" ", g)
		out := lipgloss.JoinHorizontal(lipgloss.Top, nav, gap, body, gap, party)
		return fitWidth(out, w)

	case layout.SceneModeDual:
		switch m.scenePane {
		case scenePaneNav:
			side, bodyW := layout.SceneDualWidths(w, true)
			nav := RenderPane("SCENES", navInner(paneInnerWidth(side, true)), side, h, true)
			body := RenderPane(m.sceneBodyPaneTitle(), m.renderScrolledBody(paneInnerWidth(bodyW, false), h), bodyW, h, false)
			return fitWidth(lipgloss.JoinHorizontal(lipgloss.Top, nav, strings.Repeat(" ", layout.SceneGutter), body), w)
		case scenePaneParty:
			side, bodyW := layout.SceneDualWidths(w, false)
			body := RenderPane(m.sceneBodyPaneTitle(), m.renderScrolledBody(paneInnerWidth(bodyW, false), h), bodyW, h, false)
			party := RenderPane("PARTY", partyInner(paneInnerWidth(side, true)), side, h, true)
			return fitWidth(lipgloss.JoinHorizontal(lipgloss.Top, body, strings.Repeat(" ", layout.SceneGutter), party), w)
		default:
			return RenderPane(m.sceneBodyPaneTitle(), m.renderScrolledBody(paneInnerWidth(w, true), h), w, h, true)
		}

	default: // narrow
		switch m.scenePane {
		case scenePaneNav:
			return RenderPane("SCENES", navInner(paneInnerWidth(w, true)), w, h, true)
		case scenePaneParty:
			return RenderPane("PARTY", partyInner(paneInnerWidth(w, true)), w, h, true)
		default:
			return RenderPane(m.sceneBodyPaneTitle(), m.renderScrolledBody(paneInnerWidth(w, true), h), w, h, true)
		}
	}
}


func paneInnerWidth(outerW int, focused bool) int {
	_ = focused
	// outer - borders(2) - horizontal padding(2)
	inner := outerW - 4
	if inner < 8 {
		inner = 8
	}
	return inner
}

func fitWidth(s string, maxW int) string {
	if lipgloss.Width(s) <= maxW {
		return s
	}
	// Soft clip: truncate each line to maxW visible cells.
	lines := strings.Split(s, "\n")
	for i, line := range lines {
		if lipgloss.Width(line) > maxW {
			lines[i] = TruncateVisible(line, maxW)
		}
	}
	return strings.Join(lines, "\n")
}

func (m *Model) scenePaneTitle() string {
	if m.sceneDetail != nil {
		if t := strings.TrimSpace(m.sceneDetail.Title); t != "" {
			return strings.ToUpper(t)
		}
		return m.sceneDetail.ID
	}
	return "SCENE"
}

func (m *Model) sceneBodyPaneTitle() string {
	base := m.scenePaneTitle()
	maxOff := m.sceneBodyLines - m.sceneBodyViewport
	if maxOff <= 0 || m.sceneBodyViewport <= 0 {
		return base
	}
	// 1-based position through scrollable range
	pos := m.sceneBodyScroll + 1
	total := maxOff + 1
	return TruncateVisible(base+"  ↓"+trimNum(float64(pos))+"/"+trimNum(float64(total)), 48)
}

func (m *Model) bodyViewportLines(paneOuterH int) int {
	// borders (2) + title line (1)
	v := paneOuterH - 3
	if v < 3 {
		v = 3
	}
	return v
}

func (m *Model) clampSceneBodyScroll() {
	m.sceneBodyScroll = ClampScrollOffset(m.sceneBodyScroll, m.sceneBodyLines, m.sceneBodyViewport)
}

func (m *Model) scrollSceneBody(delta int) {
	if m.sceneBodyViewport <= 0 {
		// viewport unknown until first render; allow tentative scroll
		m.sceneBodyScroll += delta
		if m.sceneBodyScroll < 0 {
			m.sceneBodyScroll = 0
		}
		return
	}
	m.sceneBodyScroll += delta
	m.clampSceneBodyScroll()
}

func (m *Model) renderScrolledBody(innerW, paneOuterH int) string {
	full := m.renderSceneBodyContent(innerW)
	lines := strings.Split(full, "\n")
	m.sceneBodyLines = len(lines)
	m.sceneBodyViewport = m.bodyViewportLines(paneOuterH)
	m.clampSceneBodyScroll()
	window, off := ScrollWindow(lines, m.sceneBodyScroll, m.sceneBodyViewport)
	m.sceneBodyScroll = off
	out := strings.Join(window, "\n")
	maxOff := m.sceneBodyLines - m.sceneBodyViewport
	if maxOff > 0 {
		var hint string
		if m.sceneBodyScroll > 0 && m.sceneBodyScroll < maxOff {
			hint = "▴ more · ▾ more"
		} else if m.sceneBodyScroll > 0 {
			hint = "▴ more"
		} else if m.sceneBodyScroll < maxOff {
			hint = "▾ more"
		}
		if hint != "" {
			out = out + "\n" + AppTheme.Muted.Render(hint)
		}
	}
	return out
}

func (m *Model) renderScrolledNav(innerW, paneOuterH int) string {
	var header strings.Builder
	if m.searching && m.tab == tabScene {
		header.WriteString(AppTheme.Amber.Render("／ "))
		header.WriteString(AppTheme.Text.Render(m.searchInput.View()))
	} else {
		header.WriteString(AppTheme.Muted.Render("／ search titles"))
	}
	header.WriteByte('\n')
	header.WriteString(AppTheme.Muted.Render(strings.Repeat("─", max(4, min(innerW, 24)))))
	headerStr := header.String()
	headerH := lipgloss.Height(headerStr)

	rows := m.buildSceneNavRows(innerW)
	if len(rows) == 0 {
		return headerStr + "\n" + AppTheme.Muted.Render("(no scenes)")
	}

	viewport := paneOuterH - 3 - headerH // borders+title, then fixed header
	if viewport < 3 {
		viewport = 3
	}

	selLine := 0
	for i, r := range rows {
		if r.sceneIdx == m.sceneListCursor {
			selLine = i
			break
		}
	}
	m.sceneNavScroll = EnsureVisibleScroll(m.sceneNavScroll, selLine, viewport, len(rows))
	window, off := ScrollWindow(rowTexts(rows), m.sceneNavScroll, viewport)
	m.sceneNavScroll = off

	out := headerStr + "\n" + strings.Join(window, "\n")
	maxOff := len(rows) - viewport
	if maxOff > 0 {
		var hint string
		if m.sceneNavScroll > 0 && m.sceneNavScroll < maxOff {
			hint = "▴ more · ▾ more"
		} else if m.sceneNavScroll > 0 {
			hint = "▴ more"
		} else if m.sceneNavScroll < maxOff {
			hint = "▾ more"
		}
		if hint != "" {
			out += "\n" + AppTheme.Muted.Render(hint)
		}
	}
	return out
}

type sceneNavRow struct {
	text     string
	sceneIdx int // -1 for group headers
}

func rowTexts(rows []sceneNavRow) []string {
	out := make([]string, len(rows))
	for i, r := range rows {
		out[i] = r.text
	}
	return out
}

func (m *Model) buildSceneNavRows(innerW int) []sceneNavRow {
	scenes := m.filteredScenes()
	if len(scenes) == 0 {
		return nil
	}
	groupTitles := map[string]string{}
	if m.sceneList != nil {
		for _, g := range m.sceneList.Groups {
			id, _ := g["id"].(string)
			title, _ := g["title"].(string)
			if id != "" {
				if title == "" {
					title = id
				}
				groupTitles[id] = title
			}
		}
	}
	curID := ""
	if m.sceneDetail != nil {
		curID = m.sceneDetail.ID
	}
	var rows []sceneNavRow
	lastGroup := "\x00"
	for i, s := range scenes {
		gid := s.GroupID
		if gid != lastGroup {
			lastGroup = gid
			if title, ok := groupTitles[gid]; ok && gid != "" {
				rows = append(rows, sceneNavRow{
					text:     AppTheme.GroupHeader.Render(TruncateVisible(strings.ToUpper(title), innerW)),
					sceneIdx: -1,
				})
			}
		}
		mark := " "
		markStyle := AppTheme.Muted
		if s.ID == curID || s.Status == "current" {
			mark = "●"
			markStyle = AppTheme.Success
		} else if s.Status == "completed" {
			mark = "✓"
			markStyle = AppTheme.Muted
		} else if s.Status == "skipped" {
			mark = "–"
			markStyle = AppTheme.Muted
		}
		st := ""
		switch s.Status {
		case "current":
			st = ""
		case "completed":
			st = ""
		case "skipped":
			st = " · sk"
		case "unseen":
			st = ""
		default:
			if s.Status != "" {
				st = " · " + s.Status[:min(3, len(s.Status))]
			}
		}
		label := TruncateVisible(s.Title+st, max(4, innerW-4))
		line := markStyle.Render(mark) + " " + AppTheme.Text.Render(label)
		if m.scenePane == scenePaneNav && i == m.sceneListCursor {
			line = AppTheme.Selection.Width(innerW).Render("▶ " + mark + " " + TruncateVisible(s.Title+" ["+s.Status+"]", max(4, innerW-4)))
		}
		rows = append(rows, sceneNavRow{text: line, sceneIdx: i})
	}
	return rows
}

// renderSceneNavContent kept for tests / simple callers (unscrolled full list).
func (m *Model) renderSceneNavContent(innerW int) string {
	rows := m.buildSceneNavRows(innerW)
	if len(rows) == 0 {
		return AppTheme.Muted.Render("(no scenes)")
	}
	return strings.Join(rowTexts(rows), "\n")
}

func (m *Model) renderSceneBodyContent(innerW int) string {
	var parts []string
	if len(m.sceneBlocks) == 0 {
		parts = append(parts, AppTheme.Muted.Render("(empty scene content)"))
	} else {
		parts = append(parts, m.renderStyledBlocks(m.sceneBlocks, innerW))
	}
	if len(m.sceneRefs) > 0 {
		var rb strings.Builder
		rb.WriteString(AppTheme.Title.Render("References"))
		rb.WriteByte('\n')
		for i, r := range m.sceneRefs {
			label := r.Label
			if label == "" {
				label = r.ID
			}
			text := TruncateVisible(label, max(4, innerW-2))
			line := "  " + AppTheme.Reference.Render(text)
			if m.scenePane == scenePaneBody && i == m.sceneRefSel {
				line = AppTheme.Selection.Width(innerW).Render("▶ " + text)
			}
			rb.WriteString(line)
			rb.WriteByte('\n')
		}
		parts = append(parts, strings.TrimRight(rb.String(), "\n"))
	}
	return strings.Join(parts, "\n\n")
}

func (m *Model) renderStyledBlocks(blocks []scene.Block, width int) string {
	var parts []string
	for _, block := range blocks {
		parts = append(parts, m.renderStyledBlock(block, width, 0))
	}
	return strings.Join(parts, "\n\n")
}

func (m *Model) renderStyledBlock(block scene.Block, width, depth int) string {
	pad := strings.Repeat("  ", depth)
	contentW := width - len(pad)*2
	if contentW < 12 {
		contentW = 12
	}
	switch block.Type {
	case "read-aloud":
		body := m.blockPlainText(block)
		wrapped := WordWrap(body, max(8, contentW-4))
		inner := AppTheme.ReadAloudTitle.Render("READ ALOUD") + "\n" + AppTheme.Text.Render(wrapped)
		box := AppTheme.ReadAloud.Width(contentW - AppTheme.ReadAloud.GetHorizontalFrameSize()).Render(inner)
		if pad == "" {
			return box
		}
		return indentBlock(box, pad)
	case "dm-note":
		body := m.blockPlainText(block)
		wrapped := WordWrap(body, max(8, contentW-4))
		inner := AppTheme.DMNoteTitle.Render("DM NOTE") + "\n" + AppTheme.Text.Render(wrapped)
		box := AppTheme.DMNote.Width(contentW - AppTheme.DMNote.GetHorizontalFrameSize()).Render(inner)
		if pad == "" {
			return box
		}
		return indentBlock(box, pad)
	case "collapse":
		title := block.Title
		if title == "" {
			title = "Details"
		}
		var b strings.Builder
		b.WriteString(pad)
		b.WriteString(AppTheme.Amber.Render("▼ " + title))
		b.WriteByte('\n')
		if len(block.Blocks) > 0 {
			var kids []string
			for _, child := range block.Blocks {
				kids = append(kids, m.renderStyledBlock(child, width, depth+1))
			}
			b.WriteString(strings.Join(kids, "\n\n"))
		} else if t := strings.TrimSpace(block.Text); t != "" {
			b.WriteString(pad + "  ")
			b.WriteString(AppTheme.Text.Render(WordWrap(scene.DisplayText(t), max(8, contentW-2))))
		}
		return strings.TrimRight(b.String(), "\n")
	default:
		if t := strings.TrimSpace(block.Text); t != "" {
			return pad + AppTheme.Text.Render(WordWrap(scene.DisplayText(t), contentW))
		}
		if len(block.Blocks) > 0 {
			var kids []string
			for _, child := range block.Blocks {
				kids = append(kids, m.renderStyledBlock(child, width, depth))
			}
			return strings.Join(kids, "\n\n")
		}
		return ""
	}
}

func (m *Model) blockPlainText(block scene.Block) string {
	if t := strings.TrimSpace(block.Text); t != "" {
		return scene.DisplayText(t)
	}
	var parts []string
	for _, child := range block.Blocks {
		if child.Type == "text" || child.Type == "" {
			if t := strings.TrimSpace(child.Text); t != "" {
				parts = append(parts, scene.DisplayText(t))
			}
		} else {
			parts = append(parts, m.blockPlainText(child))
		}
	}
	return strings.Join(parts, "\n\n")
}

func (m *Model) renderScenePartyContent(innerW int) string {
	pcs := m.partyPCEntities()
	if len(pcs) == 0 {
		return AppTheme.Muted.Render("(no PCs in party)")
	}
	var parts []string
	for i, e := range pcs {
		card := m.renderPartyCard(e, innerW, m.scenePane == scenePaneParty && i == m.scenePartyCursor)
		parts = append(parts, card)
	}
	parts = append(parts, AppTheme.Muted.Render("Enter · character sheet"))
	return strings.Join(parts, "\n\n")
}

func (m *Model) renderPartyCard(e model.Entity, innerW int, selected bool) string {
	name := strings.ToUpper(strings.TrimSpace(e.Name))
	if name == "" {
		name = e.Key
	}
	var b strings.Builder
	if selected {
		b.WriteString(AppTheme.Selection.Width(innerW).Render("▶ " + TruncateVisible(name, max(4, innerW-2))))
	} else {
		b.WriteString(AppTheme.Title.Render(TruncateVisible(name, innerW)))
	}
	b.WriteByte('\n')

	hpCur, hpMax := 0.0, 0.0
	if e.HPCurrent != nil {
		hpCur = *e.HPCurrent
	}
	if e.HPMax != nil {
		hpMax = *e.HPMax
	}
	barW := min(10, max(4, innerW-14))
	b.WriteString(AppTheme.Muted.Render("HP  "))
	b.WriteString(HPBar(hpCur, hpMax, barW))
	b.WriteString("  ")
	b.WriteString(AppTheme.Text.Render(model.FormatHP(e.HPCurrent, e.HPMax)))
	b.WriteByte('\n')
	b.WriteString(AppTheme.Muted.Render("AC  "))
	b.WriteString(AppTheme.Text.Render(fmtAC(e.AC)))
	b.WriteByte('\n')
	b.WriteString(AppTheme.Muted.Render("PP  "))
	b.WriteString(AppTheme.Text.Render(fmtAC(e.PP)))
	b.WriteByte('\n')
	b.WriteString(AppTheme.Muted.Render("INI "))
	b.WriteString(AppTheme.Text.Render(fmtInit(e.Initiative)))
	if cond := strings.TrimSpace(e.Conditions); cond != "" {
		b.WriteByte('\n')
		b.WriteString(AppTheme.Amber.Render(TruncateVisible(cond, innerW)))
	}
	return strings.TrimRight(b.String(), "\n")
}

// RenderSceneWorkspace is exported for geometry tests.
func RenderSceneWorkspace(width, height int, pane scenePane, nav, body, party string) string {
	mode := layout.DetectSceneMode(width)
	switch mode {
	case layout.SceneModeTriple:
		left, mid, right := layout.SceneColumns(width)
		g := strings.Repeat(" ", layout.SceneGutter)
		a := RenderPane("SCENES", nav, left, height, pane == scenePaneNav)
		b := RenderPane("SCENE", body, mid, height, pane == scenePaneBody)
		c := RenderPane("PARTY", party, right, height, pane == scenePaneParty)
		out := lipgloss.JoinHorizontal(lipgloss.Top, a, g, b, g, c)
		return fitWidth(out, width)
	default:
		return RenderPane("SCENE", body, width, height, true)
	}
}
