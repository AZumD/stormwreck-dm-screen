package nav_test

import (
	"testing"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/nav"
)

func TestStackPushPopRestoresPrevious(t *testing.T) {
	var s nav.Stack
	s.Push(nav.Frame{Name: "scene", Cursor: 3, Data: map[string]string{"id": "a"}})
	s.Push(nav.Frame{Name: "library", Cursor: 1, Data: map[string]string{"type": "monster"}})

	if s.Len() != 2 {
		t.Fatalf("len %d", s.Len())
	}
	cur, ok := s.Current()
	if !ok || cur.Name != "library" || cur.Cursor != 1 {
		t.Fatalf("current %#v", cur)
	}

	popped, ok := s.Pop()
	if !ok || popped.Name != "library" {
		t.Fatalf("popped %#v", popped)
	}
	cur, ok = s.Current()
	if !ok || cur.Name != "scene" || cur.Cursor != 3 || cur.Data["id"] != "a" {
		t.Fatalf("restored %#v", cur)
	}
}

func TestReplaceAndEmpty(t *testing.T) {
	var s nav.Stack
	if _, ok := s.Pop(); ok {
		t.Fatal("empty pop")
	}
	if _, ok := s.Current(); ok {
		t.Fatal("empty current")
	}
	s.Replace(nav.Frame{Name: "home", Cursor: 0})
	if s.Len() != 1 {
		t.Fatalf("len %d", s.Len())
	}
	s.Replace(nav.Frame{Name: "campaign", Cursor: 2})
	if s.Len() != 1 {
		t.Fatalf("len after replace %d", s.Len())
	}
	cur, _ := s.Current()
	if cur.Name != "campaign" || cur.Cursor != 2 {
		t.Fatalf("%#v", cur)
	}
}

func TestDataIsolated(t *testing.T) {
	var s nav.Stack
	data := map[string]string{"k": "v"}
	s.Push(nav.Frame{Name: "x", Data: data})
	data["k"] = "mutated"
	cur, _ := s.Current()
	if cur.Data["k"] != "v" {
		t.Fatalf("expected cloned data, got %q", cur.Data["k"])
	}
}
