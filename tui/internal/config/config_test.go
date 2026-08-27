package config_test

import (
	"testing"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/config"
)

func TestParseFlags(t *testing.T) {
	cfg, pass, err := config.Parse([]string{
		"--server", "https://example.com/",
		"--campaign", "sandbox",
		"--email", "a@b.c",
		"--password", "x",
		"--poll-ms", "1500",
	})
	if err != nil {
		t.Fatal(err)
	}
	if cfg.ServerURL != "https://example.com" {
		t.Fatalf("server %q", cfg.ServerURL)
	}
	if cfg.CampaignID != "sandbox" || cfg.Email != "a@b.c" || pass != "x" || cfg.PollMs != 1500 {
		t.Fatalf("%#v pass=%q", cfg, pass)
	}
}

func TestParseAllowsEmptyCampaign(t *testing.T) {
	cfg, _, err := config.Parse([]string{"--server", "http://127.0.0.1:3000"})
	if err != nil {
		t.Fatal(err)
	}
	if cfg.CampaignID != "" {
		t.Fatalf("expected empty campaign, got %q", cfg.CampaignID)
	}
	if cfg.ServerURL != "http://127.0.0.1:3000" {
		t.Fatalf("server %q", cfg.ServerURL)
	}
}
