package music_test

import (
	"errors"
	"strings"
	"testing"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/music"
)

func TestMpvArgs(t *testing.T) {
	args := music.MpvArgs("https://example/a.mp3", 70, true)
	joined := strings.Join(args, " ")
	if !strings.Contains(joined, "--no-video") {
		t.Fatalf("missing --no-video: %v", args)
	}
	if !strings.Contains(joined, "--force-window=no") {
		t.Fatalf("missing --force-window=no: %v", args)
	}
	if !strings.Contains(joined, "--volume=70") {
		t.Fatalf("volume: %v", args)
	}
	if !strings.Contains(joined, "--loop") {
		t.Fatalf("missing --loop: %v", args)
	}
	if args[len(args)-1] != "https://example/a.mp3" {
		t.Fatalf("url last: %v", args)
	}
}

func TestMpvArgsClampVolume(t *testing.T) {
	low := music.MpvArgs("u", -5, false)
	if !strings.Contains(strings.Join(low, " "), "--volume=0") {
		t.Fatalf("%v", low)
	}
	high := music.MpvArgs("u", 150, false)
	if !strings.Contains(strings.Join(high, " "), "--volume=100") {
		t.Fatalf("%v", high)
	}
	noLoop := music.MpvArgs("u", 50, false)
	for _, a := range noLoop {
		if a == "--loop" {
			t.Fatal("unexpected --loop")
		}
	}
}

func TestMpvArgsHTTPHeaders(t *testing.T) {
	args := music.MpvArgs("https://ex/a", 50, false, "Cookie: sw_session=tok")
	joined := strings.Join(args, " ")
	if !strings.Contains(joined, "--http-header-fields=Cookie: sw_session=tok") {
		t.Fatalf("%v", args)
	}
}

func TestMissingMpvNoPanic(t *testing.T) {
	p := &music.Player{Path: "mpv-definitely-not-installed-xyz"}
	if p.Available() {
		t.Fatal("expected unavailable")
	}
	err := p.Play("https://example/x.mp3", 50, false)
	if !errors.Is(err, music.ErrUnavailable) {
		t.Fatalf("got %v", err)
	}
	if err := p.Pause(); !errors.Is(err, music.ErrUnavailable) {
		t.Fatalf("pause %v", err)
	}
	if err := p.Stop(); !errors.Is(err, music.ErrUnavailable) {
		t.Fatalf("stop %v", err)
	}
}
