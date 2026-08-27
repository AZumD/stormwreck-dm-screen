package ui

import (
	"fmt"
	"strings"
)

// CampaignClock mirrors campaign-state.clock (tenday day 1–10, minute 0–1439).
type CampaignClock struct {
	Day    int
	Minute int
}

// NormalizeClock clamps to the CampaignState tenday model.
func NormalizeClock(day, minute int) CampaignClock {
	if day < 1 {
		day = 1
	}
	if day > 10 {
		day = 10
	}
	if minute < 0 {
		minute = 0
	}
	if minute > 1439 {
		minute = 1439
	}
	return CampaignClock{Day: day, Minute: minute}
}

// FormatClockCompact returns e.g. "DAY 2 · 09:20".
func FormatClockCompact(c CampaignClock) string {
	c = NormalizeClock(c.Day, c.Minute)
	hh := c.Minute / 60
	mm := c.Minute % 60
	return fmt.Sprintf("DAY %d · %02d:%02d", c.Day, hh, mm)
}

// AdjustClockMinutes adds delta minutes without rolling the tenday day.
func AdjustClockMinutes(c CampaignClock, delta int) CampaignClock {
	c = NormalizeClock(c.Day, c.Minute)
	return NormalizeClock(c.Day, c.Minute+delta)
}

// AdjustClockDay moves tenday day by delta (clamped 1–10).
func AdjustClockDay(c CampaignClock, delta int) CampaignClock {
	c = NormalizeClock(c.Day, c.Minute)
	return NormalizeClock(c.Day+delta, c.Minute)
}

// ParseClockHM parses "HH:MM" or "H:MM" into minute-of-day.
func ParseClockHM(raw string) (int, error) {
	s := strings.TrimSpace(raw)
	parts := strings.Split(s, ":")
	if len(parts) != 2 {
		return 0, fmt.Errorf("use HH:MM")
	}
	var hh, mm int
	if _, err := fmt.Sscanf(parts[0], "%d", &hh); err != nil {
		return 0, err
	}
	if _, err := fmt.Sscanf(parts[1], "%d", &mm); err != nil {
		return 0, err
	}
	if hh < 0 || hh > 23 || mm < 0 || mm > 59 {
		return 0, fmt.Errorf("invalid time")
	}
	return hh*60 + mm, nil
}

// AdjustInt applies a delta with optional clamp. max < min means no upper bound.
func AdjustInt(v, delta, min, max int) int {
	n := v + delta
	if n < min {
		n = min
	}
	if max >= min && n > max {
		n = max
	}
	return n
}

// SceneStatuses is the canonical live-status order.
var SceneStatuses = []string{"unseen", "current", "completed", "skipped"}

// NextSceneStatus cycles status by delta.
func NextSceneStatus(current string, delta int) string {
	idx := 0
	cur := strings.ToLower(strings.TrimSpace(current))
	for i, s := range SceneStatuses {
		if s == cur {
			idx = i
			break
		}
	}
	n := len(SceneStatuses)
	idx = ((idx + delta) % n + n) % n
	return SceneStatuses[idx]
}
