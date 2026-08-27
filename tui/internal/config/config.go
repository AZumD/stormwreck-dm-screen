package config

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// Config holds TUI runtime settings. Server remains canonical; nothing here is game state.
type Config struct {
	ServerURL  string `json:"serverUrl"`
	CampaignID string `json:"campaignId"`
	Email      string `json:"email,omitempty"`
	PollMs     int    `json:"pollMs,omitempty"`
}

func Default() Config {
	return Config{
		ServerURL:  "http://127.0.0.1:3000",
		CampaignID: "stormwreck-isle",
		PollMs:     2000,
	}
}

func configPath() string {
	if p := strings.TrimSpace(os.Getenv("STORMWRECK_CONFIG")); p != "" {
		return p
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "stormwreck-tui.json"
	}
	return filepath.Join(home, ".config", "stormwreck", "config.json")
}

func LoadFile(path string) (Config, error) {
	cfg := Default()
	if path == "" {
		path = configPath()
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return cfg, nil
		}
		return cfg, err
	}
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return cfg, fmt.Errorf("parse config %s: %w", path, err)
	}
	return cfg, nil
}

// Parse merges optional config file with CLI flags. Password is never loaded from disk.
func Parse(args []string) (Config, string, error) {
	cfg, err := LoadFile("")
	if err != nil {
		return cfg, "", err
	}
	fs := flag.NewFlagSet("stormwreck", flag.ContinueOnError)
	server := fs.String("server", cfg.ServerURL, "Stormwreck server base URL (https://…)")
	campaign := fs.String("campaign", cfg.CampaignID, "campaign id")
	email := fs.String("email", cfg.Email, "login email (password is prompted if needed)")
	password := fs.String("password", "", "login password (prefer interactive prompt; not stored)")
	poll := fs.Int("poll-ms", cfg.PollMs, "shared-state poll interval in milliseconds")
	configFile := fs.String("config", "", "optional JSON config path")
	if err := fs.Parse(args); err != nil {
		return cfg, "", err
	}
	if *configFile != "" {
		loaded, err := LoadFile(*configFile)
		if err != nil {
			return cfg, "", err
		}
		cfg = loaded
	}
	cfg.ServerURL = strings.TrimRight(strings.TrimSpace(*server), "/")
	cfg.CampaignID = strings.TrimSpace(*campaign)
	cfg.Email = strings.TrimSpace(*email)
	if *poll > 0 {
		cfg.PollMs = *poll
	}
	if cfg.ServerURL == "" {
		return cfg, "", fmt.Errorf("server URL is required (--server)")
	}
	if cfg.CampaignID == "" {
		return cfg, "", fmt.Errorf("campaign id is required (--campaign)")
	}
	if cfg.PollMs < 500 {
		cfg.PollMs = 500
	}
	return cfg, *password, nil
}
