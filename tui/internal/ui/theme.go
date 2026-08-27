package ui

import (
	"github.com/charmbracelet/lipgloss"
)

// CRT / phosphor palette — truecolor with ANSI fallbacks via lipgloss.Color.
var (
	colorGreen  = lipgloss.Color("#5AF78E")
	colorAmber  = lipgloss.Color("#FFB454")
	colorText   = lipgloss.Color("#E8E4D9")
	colorMuted  = lipgloss.Color("#6F6A60")
	colorBorder = lipgloss.Color("#3A3832")
	colorError  = lipgloss.Color("#FF6B6B")
	colorBgSel  = lipgloss.Color("#1A3324")
)

// Theme holds shared Lip Gloss styles for the TUI console look.
type Theme struct {
	Text       lipgloss.Style
	Muted      lipgloss.Style
	Title      lipgloss.Style
	Selection  lipgloss.Style
	Reference  lipgloss.Style
	Error      lipgloss.Style
	Success    lipgloss.Style
	Amber      lipgloss.Style
	TabActive  lipgloss.Style
	TabInactive lipgloss.Style
	ConnOK     lipgloss.Style
	ConnWarn   lipgloss.Style
	ConnErr    lipgloss.Style

	Pane         lipgloss.Style
	PaneFocused  lipgloss.Style
	PaneTitle    lipgloss.Style
	PaneTitleOn  lipgloss.Style
	GroupHeader  lipgloss.Style

	ReadAloud      lipgloss.Style
	ReadAloudTitle lipgloss.Style
	DMNote         lipgloss.Style
	DMNoteTitle    lipgloss.Style

	HelpKey  lipgloss.Style
	HelpText lipgloss.Style
	HelpSep  lipgloss.Style

	Chrome lipgloss.Style
}

// DefaultTheme returns the CRT console theme.
func DefaultTheme() Theme {
	rounded := lipgloss.RoundedBorder()
	return Theme{
		Text:  lipgloss.NewStyle().Foreground(colorText),
		Muted: lipgloss.NewStyle().Foreground(colorMuted),
		Title: lipgloss.NewStyle().Bold(true).Foreground(colorText),
		Selection: lipgloss.NewStyle().
			Bold(true).
			Foreground(colorGreen).
			Background(colorBgSel),
		Reference: lipgloss.NewStyle().Foreground(colorGreen).Underline(true),
		Error:     lipgloss.NewStyle().Foreground(colorError).Bold(true),
		Success:   lipgloss.NewStyle().Foreground(colorGreen),
		Amber:     lipgloss.NewStyle().Foreground(colorAmber),
		TabActive: lipgloss.NewStyle().
			Bold(true).
			Foreground(colorGreen).
			Underline(true),
		TabInactive: lipgloss.NewStyle().Foreground(colorMuted),
		ConnOK:      lipgloss.NewStyle().Foreground(colorGreen).Bold(true),
		ConnWarn:    lipgloss.NewStyle().Foreground(colorAmber).Bold(true),
		ConnErr:     lipgloss.NewStyle().Foreground(colorError).Bold(true),

		Pane: lipgloss.NewStyle().
			Border(rounded).
			BorderForeground(colorBorder).
			Padding(0, 1),
		PaneFocused: lipgloss.NewStyle().
			Border(rounded).
			BorderForeground(colorGreen).
			Padding(0, 1),
		PaneTitle:   lipgloss.NewStyle().Bold(true).Foreground(colorMuted),
		PaneTitleOn: lipgloss.NewStyle().Bold(true).Foreground(colorGreen),
		GroupHeader: lipgloss.NewStyle().Bold(true).Foreground(colorAmber),

		ReadAloud: lipgloss.NewStyle().
			Border(rounded).
			BorderForeground(colorGreen).
			Padding(0, 1),
		ReadAloudTitle: lipgloss.NewStyle().Bold(true).Foreground(colorGreen),
		DMNote: lipgloss.NewStyle().
			Border(rounded).
			BorderForeground(colorAmber).
			Padding(0, 1),
		DMNoteTitle: lipgloss.NewStyle().Bold(true).Foreground(colorAmber),

		HelpKey:  lipgloss.NewStyle().Foreground(colorGreen).Bold(true),
		HelpText: lipgloss.NewStyle().Foreground(colorMuted),
		HelpSep:  lipgloss.NewStyle().Foreground(colorBorder),

		Chrome: lipgloss.NewStyle().
			Border(rounded).
			BorderForeground(colorBorder).
			Padding(0, 1),
	}
}

// AppTheme is the process-wide default theme.
var AppTheme = DefaultTheme()

// Convenience aliases used across views (point at AppTheme).
var (
	titleStyle = AppTheme.Title
	dimStyle   = AppTheme.Muted
	errStyle   = AppTheme.Error
	selStyle   = AppTheme.Selection
	tabOnStyle = AppTheme.TabActive
	boxStyle   = AppTheme.Pane
)

// PaneFrameSize returns horizontal and vertical chrome (border+padding) for a pane style.
func PaneFrameSize(focused bool) (h, v int) {
	st := AppTheme.Pane
	if focused {
		st = AppTheme.PaneFocused
	}
	return st.GetHorizontalFrameSize(), st.GetVerticalFrameSize()
}

// RenderPane wraps content in a bordered pane of exact outer width/height.
func RenderPane(title, content string, outerW, outerH int, focused bool) string {
	if outerW < 8 {
		outerW = 8
	}
	if outerH < 3 {
		outerH = 3
	}
	st := AppTheme.Pane
	titleSt := AppTheme.PaneTitle
	if focused {
		st = AppTheme.PaneFocused
		titleSt = AppTheme.PaneTitleOn
	}

	// Rounded border = 1 cell each side. Padding(0,1) sits inside Width.
	const borderCells = 2
	contentW := outerW - borderCells
	contentH := outerH - borderCells
	if contentW < 4 {
		contentW = 4
	}
	if contentH < 1 {
		contentH = 1
	}

	head := titleSt.Render(title)
	bodyH := contentH - 1
	if bodyH < 1 {
		bodyH = 1
	}
	body := lipgloss.NewStyle().
		Width(contentW-st.GetHorizontalPadding()).
		Height(bodyH).
		MaxHeight(bodyH).
		Render(content)
	inner := lipgloss.JoinVertical(lipgloss.Left, head, body)
	out := st.Width(contentW).Height(contentH).MaxHeight(contentH).Render(inner)

	// Guarantee exact outer geometry for JoinHorizontal alignment.
	if lipgloss.Width(out) != outerW || lipgloss.Height(out) != outerH {
		out = lipgloss.Place(outerW, outerH, lipgloss.Left, lipgloss.Top, out)
	}
	return out
}

