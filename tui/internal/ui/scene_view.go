package ui

import (
	"fmt"
	"strings"

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

func (m *Model) viewSceneTab() string {
	availH := max(8, m.height-8)
	availW := max(40, m.width-2)
	leftW, midW, rightW := layout.SceneColumns(availW)

	nav := m.renderSceneNav(max(12, leftW))
	body := m.renderSceneBody(max(20, midW))
	party := m.renderSceneParty(max(12, rightW))

	if leftW == 0 && rightW == 0 {
		// Narrow: show focused side panel above/beside content.
		switch m.scenePane {
		case scenePaneNav:
			return m.joinColumns([]colSpec{
				{nav, max(18, availW*35/100)},
				{body, availW - max(18, availW*35/100)},
			}, availH)
		case scenePaneParty:
			pw := max(16, availW*30/100)
			return m.joinColumns([]colSpec{
				{body, availW - pw},
				{party, pw},
			}, availH)
		default:
			return clampViewHeight(body, availH)
		}
	}
	return m.joinColumns([]colSpec{
		{nav, leftW},
		{body, midW},
		{party, rightW},
	}, availH)
}

type colSpec struct {
	text  string
	width int
}

func (m *Model) joinColumns(cols []colSpec, height int) string {
	lines := make([][]string, len(cols))
	maxLines := 0
	for i, c := range cols {
		wrapped := wrapPadColumn(c.text, c.width, height)
		lines[i] = wrapped
		if len(wrapped) > maxLines {
			maxLines = len(wrapped)
		}
	}
	var b strings.Builder
	for row := 0; row < maxLines; row++ {
		for i, c := range cols {
			cell := ""
			if row < len(lines[i]) {
				cell = lines[i][row]
			}
			b.WriteString(padRunes(cell, c.width))
		}
		if row < maxLines-1 {
			b.WriteByte('\n')
		}
	}
	return b.String()
}

func wrapPadColumn(text string, width, height int) []string {
	if width < 4 {
		width = 4
	}
	raw := strings.Split(text, "\n")
	var out []string
	for _, line := range raw {
		for _, chunk := range wrapLine(line, width) {
			out = append(out, chunk)
			if height > 0 && len(out) >= height {
				return out
			}
		}
	}
	for len(out) < height {
		out = append(out, "")
	}
	return out
}

func wrapLine(line string, width int) []string {
	r := []rune(line)
	if len(r) == 0 {
		return []string{""}
	}
	if len(r) <= width {
		return []string{line}
	}
	var out []string
	for len(r) > width {
		out = append(out, string(r[:width]))
		r = r[width:]
	}
	if len(r) > 0 {
		out = append(out, string(r))
	}
	return out
}

func padRunes(s string, width int) string {
	r := []rune(s)
	if len(r) > width {
		return string(r[:width])
	}
	return s + strings.Repeat(" ", width-len(r))
}

func clampViewHeight(s string, height int) string {
	lines := strings.Split(s, "\n")
	if len(lines) > height {
		lines = lines[:height]
	}
	return strings.Join(lines, "\n")
}

func (m *Model) renderSceneNav(width int) string {
	var b strings.Builder
	header := "SCENES"
	if m.scenePane == scenePaneNav {
		header = "▶ SCENES"
	}
	b.WriteString(titleStyle.Render(truncate(header, width)))
	b.WriteByte('\n')
	if m.searching && m.tab == tabScene {
		b.WriteString(dimStyle.Render("/ " + m.searchInput.Value()))
		b.WriteByte('\n')
	} else {
		b.WriteString(dimStyle.Render("/ search"))
		b.WriteByte('\n')
	}

	scenes := m.filteredScenes()
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
	lastGroup := "\x00"
	if len(scenes) == 0 {
		b.WriteString(dimStyle.Render("(no scenes)"))
		b.WriteByte('\n')
	}
	for i, s := range scenes {
		gid := s.GroupID
		if gid != lastGroup {
			lastGroup = gid
			if title, ok := groupTitles[gid]; ok && gid != "" {
				b.WriteString(dimStyle.Render(truncate("· "+title, width)))
				b.WriteByte('\n')
			}
		}
		mark := " "
		if s.ID == curID {
			mark = "●"
		} else if s.Status == "current" {
			mark = "○"
		} else if s.Status == "completed" {
			mark = "✓"
		}
		label := truncate(fmt.Sprintf("%s %s", mark, s.Title), max(4, width-1))
		line := "  " + label
		if m.scenePane == scenePaneNav && i == m.sceneListCursor {
			line = selStyle.Render("▶ " + label)
		}
		b.WriteString(line)
		b.WriteByte('\n')
	}
	return strings.TrimRight(b.String(), "\n")
}

func (m *Model) renderSceneBody(width int) string {
	var b strings.Builder
	title := "(no scene)"
	if m.sceneDetail != nil {
		title = m.sceneDetail.Title
		if title == "" {
			title = m.sceneDetail.ID
		}
	}
	head := title
	if m.scenePane == scenePaneBody {
		head = "▶ " + title
	}
	b.WriteString(titleStyle.Render(truncate(head, width)))
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
			text := fmt.Sprintf("@%s:%s %s", r.Type, r.ID, label)
			line := "  " + truncate(text, max(4, width-2))
			if m.scenePane == scenePaneBody && i == m.sceneRefSel {
				line = selStyle.Render("▶ " + truncate(text, max(4, width-2)))
			}
			b.WriteString(line)
			b.WriteByte('\n')
		}
	}
	return strings.TrimRight(b.String(), "\n")
}

func (m *Model) renderSceneParty(width int) string {
	var b strings.Builder
	header := "PARTY"
	if m.scenePane == scenePaneParty {
		header = "▶ PARTY"
	}
	b.WriteString(titleStyle.Render(truncate(header, width)))
	b.WriteByte('\n')
	pcs := m.partyPCEntities()
	if len(pcs) == 0 {
		b.WriteString(dimStyle.Render("(no PCs)"))
		return b.String()
	}
	for i, e := range pcs {
		hp := model.FormatHP(e.HPCurrent, e.HPMax)
		ac := "—"
		if e.AC != nil {
			ac = trimNum(*e.AC)
		}
		label := truncate(fmt.Sprintf("%s  %s  AC%s", e.Name, hp, ac), max(4, width-1))
		line := "  " + label
		if m.scenePane == scenePaneParty && i == m.scenePartyCursor {
			line = selStyle.Render("▶ " + label)
		}
		b.WriteString(line)
		b.WriteByte('\n')
	}
	b.WriteString(dimStyle.Render("Enter sheet"))
	return strings.TrimRight(b.String(), "\n")
}
