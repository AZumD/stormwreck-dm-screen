package main

import (
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/config"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/ui"
)

func main() {
	cfg, password, err := config.Parse(os.Args[1:])
	if err != nil {
		fmt.Fprintf(os.Stderr, "stormwreck: %v\n", err)
		os.Exit(2)
	}
	m, err := ui.New(cfg, password)
	if err != nil {
		fmt.Fprintf(os.Stderr, "stormwreck: %v\n", err)
		os.Exit(1)
	}
	p := tea.NewProgram(m, tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "stormwreck: %v\n", err)
		os.Exit(1)
	}
}
