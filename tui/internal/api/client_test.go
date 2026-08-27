package api_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/api"
)

func TestURLConstruction(t *testing.T) {
	c, err := api.New("https://example.com/base/")
	if err != nil {
		t.Fatal(err)
	}
	got := c.URL("api", "health")
	want := "https://example.com/base/api/health"
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
}

func TestLoginSetsSessionCookie(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/auth/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("method %s", r.Method)
		}
		if ct := r.Header.Get("Content-Type"); ct != "application/json" {
			t.Errorf("content-type %q", ct)
		}
		var body map[string]string
		_ = json.NewDecoder(r.Body).Decode(&body)
		if body["email"] != "dm@example.com" || body["password"] != "secret" {
			t.Errorf("body %#v", body)
		}
		http.SetCookie(w, &http.Cookie{Name: "sw_session", Value: "tok-abc", Path: "/"})
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ok":   true,
			"user": map[string]string{"id": "u1", "name": "DM", "email": "dm@example.com"},
			"memberships": []any{
				map[string]string{"campaignId": "stormwreck-isle", "role": "dm"},
			},
		})
	})
	mux.HandleFunc("/api/auth/me", func(w http.ResponseWriter, r *http.Request) {
		ck, err := r.Cookie("sw_session")
		if err != nil || ck.Value != "tok-abc" {
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": "Authentication required"})
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ok":          true,
			"user":        map[string]string{"id": "u1", "name": "DM", "email": "dm@example.com"},
			"memberships": []any{},
		})
	})
	srv := httptest.NewServer(mux)
	defer srv.Close()

	c, err := api.New(srv.URL)
	if err != nil {
		t.Fatal(err)
	}
	res, err := c.Login("dm@example.com", "secret")
	if err != nil {
		t.Fatal(err)
	}
	if res.User.Email != "dm@example.com" {
		t.Fatalf("user %#v", res.User)
	}
	if !c.HasSessionCookie() {
		t.Fatal("expected session cookie in jar")
	}
	me, err := c.Me()
	if err != nil {
		t.Fatal(err)
	}
	if me.User.ID != "u1" {
		t.Fatalf("me %#v", me.User)
	}
}

func TestUnauthorized(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"ok":false,"error":"Authentication required"}`))
	}))
	defer srv.Close()
	c, err := api.New(srv.URL)
	if err != nil {
		t.Fatal(err)
	}
	_, err = c.GetDocument("stormwreck-isle", "map-state")
	if err != api.ErrUnauthorized {
		t.Fatalf("got %v want ErrUnauthorized", err)
	}
}

func TestPatchDocument(t *testing.T) {
	var gotBody map[string]any
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPatch {
			t.Errorf("method %s", r.Method)
		}
		_ = json.NewDecoder(r.Body).Decode(&gotBody)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ok":       true,
			"kind":     "map-state",
			"document": map[string]any{"initiativeTracker": map[string]any{"pc:1": map[string]any{"initiative": 18}}},
		})
	}))
	defer srv.Close()
	c, err := api.New(srv.URL)
	if err != nil {
		t.Fatal(err)
	}
	doc, err := c.PatchDocument("c1", "map-state", map[string]any{
		"initiativeTracker": map[string]any{"pc:1": map[string]any{"initiative": 18, "name": "Ada", "kind": "pc"}},
	})
	if err != nil {
		t.Fatal(err)
	}
	if gotBody["initiativeTracker"] == nil {
		t.Fatalf("patch body %#v", gotBody)
	}
	if len(doc) == 0 {
		t.Fatal("empty document")
	}
}
