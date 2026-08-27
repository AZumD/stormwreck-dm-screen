package ui

import (
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
)

// normalizePrintableKey repairs Windows AltGr / paste misclassification where a
// printable '@' arrives as KeyCtrlAt (ctrl+@ / alt+ctrl+@) with empty Runes.
// Prefer KeyRunes so bubbles/textinput can insert the character normally.
func normalizePrintableKey(msg tea.KeyMsg) tea.KeyMsg {
	switch msg.String() {
	case "ctrl+@", "alt+ctrl+@":
		return tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'@'}, Paste: msg.Paste}
	}
	if msg.Type == tea.KeyCtrlAt && len(msg.Runes) == 0 {
		return tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'@'}, Paste: msg.Paste}
	}
	return msg
}

// updateFocusedInput forwards a key to textinput after printable normalization.
// Callers must handle Enter/Esc/Tab/ctrl+c themselves before calling this.
func updateFocusedInput(input textinput.Model, msg tea.KeyMsg) (textinput.Model, tea.Cmd) {
	return input.Update(normalizePrintableKey(msg))
}

// isTextFieldNavKey reports keys that should navigate/submit focused fields
// rather than being typed as characters.
func isTextFieldNavKey(msg tea.KeyMsg) bool {
	switch msg.String() {
	case "enter", "esc", "tab", "shift+tab", "up", "down", "ctrl+c":
		return true
	default:
		return false
	}
}
