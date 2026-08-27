package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"strings"
	"time"
)

const cookieName = "sw_session"

// ErrUnauthorized is returned on HTTP 401.
var ErrUnauthorized = fmt.Errorf("unauthorized")

// Client talks to the Stormwreck HTTPS/HTTP API with a cookie jar session.
type Client struct {
	base   *url.URL
	http   *http.Client
	jar    http.CookieJar
}

func New(baseURL string) (*Client, error) {
	u, err := url.Parse(strings.TrimRight(strings.TrimSpace(baseURL), "/"))
	if err != nil {
		return nil, fmt.Errorf("server URL: %w", err)
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return nil, fmt.Errorf("server URL must be http or https")
	}
	jar, err := cookiejar.New(nil)
	if err != nil {
		return nil, err
	}
	return &Client{
		base: u,
		jar:  jar,
		http: &http.Client{
			Timeout: 30 * time.Second,
			Jar:     jar,
		},
	}, nil
}

func (c *Client) BaseURL() string {
	return c.base.String()
}

func (c *Client) HasSessionCookie() bool {
	for _, ck := range c.jar.Cookies(c.base) {
		if ck.Name == cookieName && ck.Value != "" {
			return true
		}
	}
	return false
}

func (c *Client) URL(parts ...string) string {
	rel := pathJoin(parts...)
	u := *c.base
	u.Path = singleJoin(c.base.Path, rel)
	return u.String()
}

func pathJoin(parts ...string) string {
	clean := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.Trim(p, "/")
		if p != "" {
			clean = append(clean, p)
		}
	}
	return strings.Join(clean, "/")
}

func singleJoin(basePath, rel string) string {
	basePath = strings.TrimSuffix(basePath, "/")
	if rel == "" {
		return basePath
	}
	if basePath == "" {
		return "/" + rel
	}
	return basePath + "/" + rel
}

type apiError struct {
	Status int
	Body   string
}

func (e *apiError) Error() string {
	if e.Body != "" {
		return fmt.Sprintf("HTTP %d: %s", e.Status, e.Body)
	}
	return fmt.Sprintf("HTTP %d", e.Status)
}

func (c *Client) doJSON(method, path string, body any, out any) error {
	var rdr io.Reader
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			return err
		}
		rdr = bytes.NewReader(raw)
	}
	req, err := http.NewRequest(method, c.URL(path), rdr)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")
	if body != nil || method == http.MethodPost || method == http.MethodPut || method == http.MethodPatch || method == http.MethodDelete {
		req.Header.Set("Content-Type", "application/json")
	}
	res, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(res.Body, 8<<20))
	if err != nil {
		return err
	}
	if res.StatusCode == http.StatusUnauthorized {
		return ErrUnauthorized
	}
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		msg := strings.TrimSpace(string(raw))
		var parsed struct {
			Error string `json:"error"`
		}
		if json.Unmarshal(raw, &parsed) == nil && parsed.Error != "" {
			msg = parsed.Error
		}
		return &apiError{Status: res.StatusCode, Body: msg}
	}
	if out == nil || len(raw) == 0 {
		return nil
	}
	if err := json.Unmarshal(raw, out); err != nil {
		return fmt.Errorf("decode response: %w", err)
	}
	return nil
}

// LoginResponse is POST /api/auth/login.
type LoginResponse struct {
	OK          bool            `json:"ok"`
	User        User            `json:"user"`
	Memberships []Membership    `json:"memberships"`
	ExpiresAt   json.RawMessage `json:"expiresAt"`
}

type User struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type Membership struct {
	CampaignID string `json:"campaignId"`
	Role       string `json:"role"`
}

func (c *Client) Login(email, password string) (*LoginResponse, error) {
	var out LoginResponse
	err := c.doJSON(http.MethodPost, "api/auth/login", map[string]string{
		"email":    email,
		"password": password,
	}, &out)
	if err != nil {
		return nil, err
	}
	if !out.OK {
		return nil, fmt.Errorf("login failed")
	}
	return &out, nil
}

func (c *Client) Me() (*LoginResponse, error) {
	var out LoginResponse
	if err := c.doJSON(http.MethodGet, "api/auth/me", nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) Health() error {
	var out struct {
		OK bool `json:"ok"`
	}
	return c.doJSON(http.MethodGet, "api/health", nil, &out)
}

func (c *Client) GetDocument(campaignID, kind string) (json.RawMessage, error) {
	var out struct {
		OK       bool            `json:"ok"`
		Document json.RawMessage `json:"document"`
	}
	path := fmt.Sprintf("api/campaigns/%s/documents/%s", url.PathEscape(campaignID), url.PathEscape(kind))
	if err := c.doJSON(http.MethodGet, path, nil, &out); err != nil {
		return nil, err
	}
	return out.Document, nil
}

func (c *Client) PatchDocument(campaignID, kind string, patch any) (json.RawMessage, error) {
	var out struct {
		OK       bool            `json:"ok"`
		Document json.RawMessage `json:"document"`
	}
	path := fmt.Sprintf("api/campaigns/%s/documents/%s", url.PathEscape(campaignID), url.PathEscape(kind))
	if err := c.doJSON(http.MethodPatch, path, patch, &out); err != nil {
		return nil, err
	}
	return out.Document, nil
}

type CharacterListItem struct {
	ID            string   `json:"id"`
	CampaignID    string   `json:"campaign_id"`
	Name          string   `json:"name"`
	Type          string   `json:"type"`
	Level         *int     `json:"level"`
	CataloguePCID *string  `json:"catalogue_pc_id"`
	HPCurrent     *float64 `json:"hp_current"`
	HPMax         *float64 `json:"hp_max"`
}

type Character struct {
	ID            string          `json:"id"`
	Name          string          `json:"name"`
	Type          string          `json:"type"`
	Level         *int            `json:"level"`
	CataloguePCID *string         `json:"catalogue_pc_id"`
	Sheet         json.RawMessage `json:"sheet"`
}

type CharacterState struct {
	HPCurrent  *float64        `json:"hp_current"`
	HPMax      *float64        `json:"hp_max"`
	HPTemp     *float64        `json:"hp_temp"`
	Conditions json.RawMessage `json:"conditions"`
	Extras     json.RawMessage `json:"extras"`
}

func (c *Client) ListCharacters(campaignID string) ([]CharacterListItem, error) {
	var out struct {
		OK         bool                `json:"ok"`
		Characters []CharacterListItem `json:"characters"`
	}
	path := fmt.Sprintf("api/campaigns/%s/characters", url.PathEscape(campaignID))
	if err := c.doJSON(http.MethodGet, path, nil, &out); err != nil {
		return nil, err
	}
	return out.Characters, nil
}

func (c *Client) GetCharacter(campaignID, characterID string) (*Character, error) {
	var out struct {
		OK        bool      `json:"ok"`
		Character Character `json:"character"`
	}
	path := fmt.Sprintf("api/campaigns/%s/characters/%s", url.PathEscape(campaignID), url.PathEscape(characterID))
	if err := c.doJSON(http.MethodGet, path, nil, &out); err != nil {
		return nil, err
	}
	return &out.Character, nil
}

func (c *Client) GetCharacterState(campaignID, characterID string) (*CharacterState, error) {
	var out struct {
		OK    bool           `json:"ok"`
		State CharacterState `json:"state"`
	}
	path := fmt.Sprintf("api/campaigns/%s/characters/%s/state", url.PathEscape(campaignID), url.PathEscape(characterID))
	if err := c.doJSON(http.MethodGet, path, nil, &out); err != nil {
		return nil, err
	}
	return &out.State, nil
}

func (c *Client) PutCharacterState(campaignID, characterID string, patch map[string]any) (*CharacterState, error) {
	var out struct {
		OK    bool           `json:"ok"`
		State CharacterState `json:"state"`
	}
	path := fmt.Sprintf("api/campaigns/%s/characters/%s/state", url.PathEscape(campaignID), url.PathEscape(characterID))
	if err := c.doJSON(http.MethodPut, path, patch, &out); err != nil {
		return nil, err
	}
	return &out.State, nil
}

func (c *Client) PatchCharacter(campaignID, characterID string, patch map[string]any) (*Character, error) {
	var out struct {
		OK        bool      `json:"ok"`
		Character Character `json:"character"`
	}
	path := fmt.Sprintf("api/campaigns/%s/characters/%s", url.PathEscape(campaignID), url.PathEscape(characterID))
	if err := c.doJSON(http.MethodPatch, path, patch, &out); err != nil {
		return nil, err
	}
	return &out.Character, nil
}

func (c *Client) ListCatalogue(typ string) ([]map[string]any, error) {
	var out struct {
		OK      bool             `json:"ok"`
		Entries []map[string]any `json:"entries"`
	}
	path := fmt.Sprintf("api/catalogues/%s", url.PathEscape(typ))
	if err := c.doJSON(http.MethodGet, path, nil, &out); err != nil {
		return nil, err
	}
	return out.Entries, nil
}

func (c *Client) GetCatalogue(typ, id string) (map[string]any, error) {
	var out struct {
		OK    bool           `json:"ok"`
		Entry map[string]any `json:"entry"`
	}
	path := fmt.Sprintf("api/catalogues/%s/%s", url.PathEscape(typ), url.PathEscape(id))
	if err := c.doJSON(http.MethodGet, path, nil, &out); err != nil {
		return nil, err
	}
	return out.Entry, nil
}

func (c *Client) PutCatalogue(typ, id string, entry map[string]any) (map[string]any, error) {
	var out struct {
		OK    bool           `json:"ok"`
		Entry map[string]any `json:"entry"`
	}
	path := fmt.Sprintf("api/catalogues/%s/%s", url.PathEscape(typ), url.PathEscape(id))
	if err := c.doJSON(http.MethodPut, path, entry, &out); err != nil {
		return nil, err
	}
	return out.Entry, nil
}
