package ui

import (
	"testing"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
)

func TestNormalizePrintableAtSign(t *testing.T) {
	cases := []tea.KeyMsg{
		{Type: tea.KeyCtrlAt},
		{Type: tea.KeyCtrlAt, Alt: true},
	}
	for _, in := range cases {
		out := normalizePrintableKey(in)
		if out.Type != tea.KeyRunes || string(out.Runes) != "@" {
			t.Fatalf("in=%#v out=%#v string=%q", in, out, out.String())
		}
	}
	// Already a normal '@' rune — unchanged content.
	keep := tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'@'}}
	got := normalizePrintableKey(keep)
	if string(got.Runes) != "@" {
		t.Fatalf("%#v", got)
	}
}

func TestTextInputAcceptsAtAndEmail(t *testing.T) {
	ti := textinput.New()
	ti.Focus()

	ti, _ = updateFocusedInput(ti, tea.KeyMsg{Type: tea.KeyCtrlAt})
	if ti.Value() != "@" {
		t.Fatalf("after KeyCtrlAt got %q", ti.Value())
	}

	ti.SetValue("")
	email := "test@example.com"
	for _, r := range email {
		msg := tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{r}}
		if r == '@' {
			// Simulate Windows AltGr / paste misclassification for '@' only.
			msg = tea.KeyMsg{Type: tea.KeyCtrlAt, Alt: true}
		}
		ti, _ = updateFocusedInput(ti, msg)
	}
	if ti.Value() != email {
		t.Fatalf("got %q want %q", ti.Value(), email)
	}
}

func TestTextInputAcceptsPunctuationAndLetters(t *testing.T) {
	ti := textinput.New()
	ti.Focus()
	sample := "ab.+-_:/,z"
	for _, r := range sample {
		ti, _ = updateFocusedInput(ti, tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{r}})
	}
	if ti.Value() != sample {
		t.Fatalf("got %q want %q", ti.Value(), sample)
	}
}

func TestPasteStyleRunesWithAt(t *testing.T) {
	ti := textinput.New()
	ti.Focus()
	// Bracketed/multi-rune paste that already has '@' as KeyRunes must keep it.
	msg := tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune("test@testing.com"), Paste: true}
	ti, _ = updateFocusedInput(ti, normalizePrintableKey(msg))
	if ti.Value() != "test@testing.com" {
		t.Fatalf("got %q", ti.Value())
	}
}

func TestGlobalShortcutsIgnoredWhileEditingSemantics(t *testing.T) {
	// While a field is focused, letter keys must go to the input — not act as
	// table shortcuts (h/i/c/a/q/j/k/r). We verify textinput receives them.
	ti := textinput.New()
	ti.Focus()
	for _, r := range []rune{'h', 'i', 'c', 'a', 'q', 'j', 'k', 'r'} {
		before := ti.Value()
		ti, _ = updateFocusedInput(ti, tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{r}})
		if ti.Value() != before+string(r) {
			t.Fatalf("shortcut letter %c not typed into field: %q", r, ti.Value())
		}
	}
	if !isTextFieldNavKey(tea.KeyMsg{Type: tea.KeyEnter}) {
		t.Fatal("enter should remain a nav/submit key")
	}
	if isTextFieldNavKey(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'h'}}) {
		t.Fatal("letter h must not be classified as nav")
	}
}
