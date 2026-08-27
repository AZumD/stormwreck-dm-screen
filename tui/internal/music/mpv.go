// Package music drives local audio via an external mpv process.
package music

import (
	"errors"
	"fmt"
	"os/exec"
	"strings"
	"sync"
)

// ErrUnavailable is returned when mpv is not installed or not runnable.
var ErrUnavailable = errors.New("mpv unavailable")

// Player controls optional local mpv playback.
type Player struct {
	// Path overrides the mpv binary (empty = look up "mpv" on PATH).
	Path string

	mu      sync.Mutex
	cmd     *exec.Cmd
	url     string
	headers []string
	volume  float64
	loop    bool
	playing bool
}

func (p *Player) bin() string {
	if p.Path != "" {
		return p.Path
	}
	return "mpv"
}

// Available reports whether an mpv binary is on PATH (or Path is set and found).
func (p *Player) Available() bool {
	_, err := exec.LookPath(p.bin())
	return err == nil
}

// MpvArgs builds the mpv argv (excluding the binary) for a play request.
// Volume is clamped to 0–100. Optional httpHeaders are passed as
// --http-header-fields (e.g. "Cookie: sw_session=…").
func MpvArgs(url string, volume float64, loop bool, httpHeaders ...string) []string {
	vol := volume
	if vol < 0 {
		vol = 0
	}
	if vol > 100 {
		vol = 100
	}
	args := []string{
		"--no-video",
		"--force-window=no",
		fmt.Sprintf("--volume=%.0f", vol),
	}
	if loop {
		args = append(args, "--loop")
	}
	for _, h := range httpHeaders {
		h = strings.TrimSpace(h)
		if h == "" {
			continue
		}
		args = append(args, "--http-header-fields="+h)
	}
	args = append(args, url)
	return args
}

// Play starts url at volume (0–100), optionally looping. Kills any previous process.
// Pass Cookie header via httpHeaders for authenticated stream URLs.
func (p *Player) Play(url string, volume float64, loop bool, httpHeaders ...string) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if !p.availableLocked() {
		return ErrUnavailable
	}
	p.stopLocked()
	p.url = url
	p.headers = append([]string(nil), httpHeaders...)
	p.volume = volume
	p.loop = loop
	args := MpvArgs(url, volume, loop, httpHeaders...)
	cmd := exec.Command(p.bin(), args...)
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	p.cmd = cmd
	p.playing = true
	go func() {
		_ = cmd.Wait()
		p.mu.Lock()
		if p.cmd == cmd {
			p.cmd = nil
			p.playing = false
		}
		p.mu.Unlock()
	}()
	return nil
}

func (p *Player) availableLocked() bool {
	_, err := exec.LookPath(p.bin())
	return err == nil
}

func (p *Player) stopLocked() {
	if p.cmd != nil && p.cmd.Process != nil {
		_ = p.cmd.Process.Kill()
		_, _ = p.cmd.Process.Wait()
	}
	p.cmd = nil
	p.playing = false
}

// Pause stops playback but keeps the last URL for Toggle resume.
func (p *Player) Pause() error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if !p.availableLocked() {
		return ErrUnavailable
	}
	p.stopLocked()
	return nil
}

// Toggle pauses if playing, otherwise resumes the last URL.
func (p *Player) Toggle() error {
	p.mu.Lock()
	playing := p.playing
	url := p.url
	vol := p.volume
	loop := p.loop
	headers := append([]string(nil), p.headers...)
	p.mu.Unlock()
	if playing {
		return p.Pause()
	}
	if url == "" {
		return nil
	}
	return p.Play(url, vol, loop, headers...)
}

// Stop kills the current process and clears the resume URL.
func (p *Player) Stop() error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if !p.availableLocked() {
		return ErrUnavailable
	}
	p.stopLocked()
	p.url = ""
	p.headers = nil
	return nil
}

// SetVolume updates volume (0–100). Restarts playback if currently playing.
func (p *Player) SetVolume(volume float64) error {
	p.mu.Lock()
	if volume < 0 {
		volume = 0
	}
	if volume > 100 {
		volume = 100
	}
	p.volume = volume
	playing := p.playing
	url := p.url
	loop := p.loop
	headers := append([]string(nil), p.headers...)
	p.mu.Unlock()
	if playing && url != "" {
		return p.Play(url, volume, loop, headers...)
	}
	return nil
}

// SetLoop updates loop preference. Restarts playback if currently playing.
func (p *Player) SetLoop(loop bool) error {
	p.mu.Lock()
	p.loop = loop
	playing := p.playing
	url := p.url
	vol := p.volume
	headers := append([]string(nil), p.headers...)
	p.mu.Unlock()
	if playing && url != "" {
		return p.Play(url, vol, loop, headers...)
	}
	return nil
}

// IsPlaying reports whether mpv is currently running.
func (p *Player) IsPlaying() bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.playing
}

// CurrentURL returns the last play URL (may be paused).
func (p *Player) CurrentURL() string {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.url
}

// Volume returns the current volume setting.
func (p *Player) Volume() float64 {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.volume == 0 && !p.playing && p.url == "" {
		return 70
	}
	return p.volume
}

// Loop returns the current loop setting.
func (p *Player) Loop() bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.loop
}
