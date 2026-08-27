package ui

import (
	"strings"
	"unicode"

	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/x/ansi"
	"github.com/mattn/go-runewidth"
)

// VisibleWidth returns ANSI-aware display width.
func VisibleWidth(s string) int {
	return lipgloss.Width(s)
}

// VisibleHeight returns the number of visual lines.
func VisibleHeight(s string) int {
	return lipgloss.Height(s)
}

// TruncateVisible truncates to at most n visible cells, appending "…" if needed.
func TruncateVisible(s string, n int) string {
	if n <= 0 {
		return ""
	}
	return ansi.Truncate(s, n, "…")
}

// WordWrap wraps plain (unstyled) text to width using word boundaries when possible.
// Preserves existing newlines as paragraph breaks. Unicode-safe via runewidth.
func WordWrap(text string, width int) string {
	if width < 4 {
		width = 4
	}
	paras := strings.Split(text, "\n")
	var out []string
	for _, para := range paras {
		if strings.TrimSpace(para) == "" {
			out = append(out, "")
			continue
		}
		out = append(out, wrapParagraph(para, width)...)
	}
	return strings.Join(out, "\n")
}

func wrapParagraph(para string, width int) []string {
	words := strings.FieldsFunc(para, func(r rune) bool {
		return unicode.IsSpace(r)
	})
	if len(words) == 0 {
		return []string{""}
	}
	var lines []string
	var cur strings.Builder
	curW := 0
	flush := func() {
		if cur.Len() == 0 {
			return
		}
		lines = append(lines, cur.String())
		cur.Reset()
		curW = 0
	}
	for _, w := range words {
		ww := runewidth.StringWidth(w)
		if ww > width {
			flush()
			lines = append(lines, hardChop(w, width)...)
			continue
		}
		need := ww
		if curW > 0 {
			need++
		}
		if curW > 0 && curW+need > width {
			flush()
		}
		if curW > 0 {
			cur.WriteByte(' ')
			curW++
		}
		cur.WriteString(w)
		curW += ww
	}
	flush()
	if len(lines) == 0 {
		return []string{""}
	}
	return lines
}

func hardChop(s string, width int) []string {
	var lines []string
	var cur strings.Builder
	w := 0
	for _, r := range s {
		rw := runewidth.RuneWidth(r)
		if w+rw > width && cur.Len() > 0 {
			lines = append(lines, cur.String())
			cur.Reset()
			w = 0
		}
		cur.WriteRune(r)
		w += rw
	}
	if cur.Len() > 0 {
		lines = append(lines, cur.String())
	}
	return lines
}

// ClipHeight keeps at most maxLines visible lines from s.
func ClipHeight(s string, maxLines int) string {
	if maxLines <= 0 {
		return ""
	}
	lines := strings.Split(s, "\n")
	if len(lines) <= maxLines {
		return s
	}
	return strings.Join(lines[:maxLines], "\n")
}

// ScrollWindow returns a window of lines starting at offset (clamped).
func ScrollWindow(lines []string, offset, viewport int) (window []string, clampedOffset int) {
	if viewport < 1 {
		viewport = 1
	}
	if len(lines) == 0 {
		return nil, 0
	}
	maxOff := len(lines) - viewport
	if maxOff < 0 {
		maxOff = 0
	}
	if offset < 0 {
		offset = 0
	}
	if offset > maxOff {
		offset = maxOff
	}
	end := offset + viewport
	if end > len(lines) {
		end = len(lines)
	}
	return lines[offset:end], offset
}

// ClampScrollOffset clamps a line scroll offset for content/viewport sizes.
func ClampScrollOffset(offset, lineCount, viewport int) int {
	if viewport < 1 {
		viewport = 1
	}
	maxOff := lineCount - viewport
	if maxOff < 0 {
		maxOff = 0
	}
	if offset < 0 {
		return 0
	}
	if offset > maxOff {
		return maxOff
	}
	return offset
}

// EnsureVisibleScroll adjusts scroll so selected index stays inside the viewport.
func EnsureVisibleScroll(scroll, selected, viewport, count int) int {
	if count <= 0 || viewport <= 0 {
		return 0
	}
	scroll = ClampScrollOffset(scroll, count, viewport)
	if selected < 0 {
		selected = 0
	}
	if selected >= count {
		selected = count - 1
	}
	if selected < scroll {
		return selected
	}
	if selected >= scroll+viewport {
		return selected - viewport + 1
	}
	return scroll
}

// HelpHints renders contextual key hints with green keys and muted labels.
func HelpHints(pairs [][2]string) string {
	var parts []string
	for i, p := range pairs {
		if i > 0 {
			parts = append(parts, AppTheme.HelpSep.Render("  "))
		}
		parts = append(parts, AppTheme.HelpKey.Render(p[0])+" "+AppTheme.HelpText.Render(p[1]))
	}
	return strings.Join(parts, "")
}

// HPBar returns a compact textual bar for cur/max HP.
func HPBar(cur, maxHP float64, width int) string {
	if width < 4 {
		width = 4
	}
	if maxHP <= 0 {
		return strings.Repeat("░", width)
	}
	ratio := cur / maxHP
	if ratio < 0 {
		ratio = 0
	}
	if ratio > 1 {
		ratio = 1
	}
	filled := int(ratio * float64(width))
	if cur > 0 && filled == 0 {
		filled = 1
	}
	if filled > width {
		filled = width
	}
	bar := strings.Repeat("█", filled) + strings.Repeat("░", width-filled)
	st := AppTheme.Success
	if ratio <= 0.25 {
		st = AppTheme.Error
	} else if ratio <= 0.5 {
		st = AppTheme.Amber
	}
	return st.Render(bar)
}
