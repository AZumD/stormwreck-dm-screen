package ui

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/api"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/asciimap"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/config"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/model"
)

type connState int

const (
	connOffline connState = iota
	connConnecting
	connConnected
	connRefreshing
	connError
	connUnauthorized
)

type screen int

const (
	screenLogin screen = iota
	screenTable
)

type editMode int

const (
	editNone editMode = iota
	editHP
	editInit
	editCond
	editAC
)

type tickMsg time.Time
type refreshDoneMsg struct {
	snap model.Snapshot
	err  error
}
type mutateDoneMsg struct {
	err error
}

type Model struct {
	cfg      config.Config
	password string
	client   *api.Client

	screen screen
	conn   connState
	status string
	errMsg string

	emailInput textinput.Model
	passInput  textinput.Model
	editInput  textinput.Model
	focusPass  bool

	snap     model.Snapshot
	selected int
	edit     editMode
	width    int
	height   int

	refreshing bool
	lastFetch  time.Time
	stale      bool
}

func New(cfg config.Config, password string) (*Model, error) {
	client, err := api.New(cfg.ServerURL)
	if err != nil {
		return nil, err
	}
	ei := textinput.New()
	ei.Placeholder = "email"
	ei.CharLimit = 200
	ei.Width = 40
	ei.SetValue(cfg.Email)
	ei.Focus()

	pi := textinput.New()
	pi.Placeholder = "password"
	pi.EchoMode = textinput.EchoPassword
	pi.EchoCharacter = '•'
	pi.CharLimit = 200
	pi.Width = 40

	ed := textinput.New()
	ed.CharLimit = 200
	ed.Width = 40

	m := &Model{
		cfg:        cfg,
		password:   password,
		client:     client,
		screen:     screenLogin,
		conn:       connOffline,
		emailInput: ei,
		passInput:  pi,
		editInput:  ed,
		width:      80,
		height:     40,
	}
	if cfg.Email != "" && password != "" {
		m.status = "Signing in…"
		m.conn = connConnecting
	}
	return m, nil
}

func (m *Model) Init() tea.Cmd {
	if m.cfg.Email != "" && m.password != "" {
		return m.cmdLogin(m.cfg.Email, m.password)
	}
	return textinput.Blink
}

func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil
	case tea.KeyMsg:
		return m.handleKey(msg)
	case tickMsg:
		if m.screen == screenTable && !m.refreshing && m.conn != connUnauthorized {
			return m, m.cmdRefresh(true)
		}
		return m, m.scheduleTick()
	case refreshDoneMsg:
		m.refreshing = false
		if msg.err != nil {
			if msg.err == api.ErrUnauthorized {
				m.conn = connUnauthorized
				m.screen = screenLogin
				m.errMsg = "Session expired — sign in again"
				m.password = ""
				return m, nil
			}
			m.conn = connError
			m.stale = true
			m.errMsg = msg.err.Error()
			return m, m.scheduleTick()
		}
		m.snap = msg.snap
		m.conn = connConnected
		m.stale = false
		m.errMsg = ""
		m.lastFetch = time.Now()
		if m.selected >= len(m.snap.Entities) {
			m.selected = max(0, len(m.snap.Entities)-1)
		}
		return m, m.scheduleTick()
	case mutateDoneMsg:
		if msg.err != nil {
			if msg.err == api.ErrUnauthorized {
				m.conn = connUnauthorized
				m.screen = screenLogin
				m.errMsg = "Session expired — sign in again"
				return m, nil
			}
			m.errMsg = msg.err.Error()
			return m, nil
		}
		m.errMsg = ""
		return m, m.cmdRefresh(true)
	case loginResultMsg:
		if msg.err != nil {
			m.conn = connError
			m.errMsg = msg.err.Error()
			m.screen = screenLogin
			m.password = ""
			return m, nil
		}
		m.password = "" // do not retain plaintext
		m.screen = screenTable
		m.conn = connConnected
		m.status = fmt.Sprintf("Signed in as %s", msg.user)
		return m, tea.Batch(m.cmdRefresh(false), m.scheduleTick())
	}
	return m, nil
}

type loginResultMsg struct {
	user string
	err  error
}

func (m *Model) handleKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	if m.screen == screenLogin {
		return m.handleLoginKey(msg)
	}
	if m.edit != editNone {
		return m.handleEditKey(msg)
	}
	switch msg.String() {
	case "ctrl+c", "q":
		return m, tea.Quit
	case "up", "k":
		if m.selected > 0 {
			m.selected--
		}
	case "down", "j":
		if m.selected < len(m.snap.Entities)-1 {
			m.selected++
		}
	case "r":
		return m, m.cmdRefresh(true)
	case "h":
		if e := m.selectedEntity(); e != nil && e.EditableHP {
			m.beginEdit(editHP, "HP (+/-/delta or =n or n/m)")
		} else {
			m.errMsg = "HP not editable for this entity (monster tokens are read-only in TUI MVP)"
		}
	case "i":
		if e := m.selectedEntity(); e != nil {
			cur := ""
			if e.Initiative != 0 {
				cur = trimNum(e.Initiative)
			}
			m.beginEdit(editInit, "Initiative (0 clears)")
			m.editInput.SetValue(cur)
		}
	case "c":
		if e := m.selectedEntity(); e != nil && e.EditableCond {
			m.beginEdit(editCond, "Conditions (comma-separated)")
			m.editInput.SetValue(e.Conditions)
		} else {
			m.errMsg = "Conditions not editable for this entity"
		}
	case "a":
		if e := m.selectedEntity(); e != nil && e.EditableAC {
			cur := ""
			if e.AC != nil {
				cur = trimNum(*e.AC)
			}
			m.beginEdit(editAC, "AC")
			m.editInput.SetValue(cur)
		} else {
			m.errMsg = "AC not editable for this entity"
		}
	}
	return m, nil
}

func (m *Model) handleLoginKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "ctrl+c":
		return m, tea.Quit
	case "tab", "down":
		m.focusPass = true
		m.emailInput.Blur()
		m.passInput.Focus()
		return m, textinput.Blink
	case "shift+tab", "up":
		m.focusPass = false
		m.passInput.Blur()
		m.emailInput.Focus()
		return m, textinput.Blink
	case "enter":
		email := strings.TrimSpace(m.emailInput.Value())
		pass := m.passInput.Value()
		if email == "" || pass == "" {
			m.errMsg = "email and password required"
			return m, nil
		}
		m.conn = connConnecting
		m.errMsg = ""
		return m, m.cmdLogin(email, pass)
	}
	/* Printable runes (incl. @ . + etc.) go to textinput before any other routing. */
	var cmd tea.Cmd
	if m.focusPass {
		m.passInput, cmd = updateFocusedInput(m.passInput, msg)
	} else {
		m.emailInput, cmd = updateFocusedInput(m.emailInput, msg)
	}
	return m, cmd
}

func (m *Model) handleEditKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "esc":
		m.edit = editNone
		m.editInput.Blur()
		return m, nil
	case "enter":
		val := m.editInput.Value()
		mode := m.edit
		m.edit = editNone
		m.editInput.Blur()
		return m, m.cmdMutate(mode, val)
	case "ctrl+c":
		return m, tea.Quit
	}
	var cmd tea.Cmd
	m.editInput, cmd = updateFocusedInput(m.editInput, msg)
	return m, cmd
}

func (m *Model) beginEdit(mode editMode, placeholder string) {
	m.edit = mode
	m.editInput.Placeholder = placeholder
	m.editInput.SetValue("")
	m.editInput.Focus()
	m.errMsg = ""
}

func (m *Model) selectedEntity() *model.Entity {
	if m.selected < 0 || m.selected >= len(m.snap.Entities) {
		return nil
	}
	return &m.snap.Entities[m.selected]
}

func (m *Model) scheduleTick() tea.Cmd {
	d := time.Duration(m.cfg.PollMs) * time.Millisecond
	return tea.Tick(d, func(t time.Time) tea.Msg { return tickMsg(t) })
}

func (m *Model) cmdLogin(email, password string) tea.Cmd {
	client := m.client
	return func() tea.Msg {
		res, err := client.Login(email, password)
		if err != nil {
			return loginResultMsg{err: err}
		}
		return loginResultMsg{user: res.User.Email}
	}
}

func (m *Model) cmdRefresh(background bool) tea.Cmd {
	if m.refreshing {
		return nil
	}
	m.refreshing = true
	if background {
		m.conn = connRefreshing
	}
	client := m.client
	campaign := m.cfg.CampaignID
	return func() tea.Msg {
		snap, err := fetchSnapshot(client, campaign)
		return refreshDoneMsg{snap: snap, err: err}
	}
}

func (m *Model) cmdMutate(mode editMode, raw string) tea.Cmd {
	e := m.selectedEntity()
	if e == nil {
		return nil
	}
	client := m.client
	campaign := m.cfg.CampaignID
	ent := *e
	return func() tea.Msg {
		err := applyMutation(client, campaign, ent, mode, raw)
		return mutateDoneMsg{err: err}
	}
}

func fetchSnapshot(client *api.Client, campaignID string) (model.Snapshot, error) {
	mapRaw, err := client.GetDocument(campaignID, "map-state")
	if err != nil {
		return model.Snapshot{}, err
	}
	csRaw, err := client.GetDocument(campaignID, "campaign-state")
	if err != nil {
		return model.Snapshot{}, err
	}
	locRaw, err := client.GetDocument(campaignID, "locations")
	if err != nil {
		return model.Snapshot{}, err
	}
	ms, err := model.ParseMapState(mapRaw)
	if err != nil {
		return model.Snapshot{}, err
	}
	cs, err := model.ParseCampaignState(csRaw)
	if err != nil {
		return model.Snapshot{}, err
	}
	locs, err := model.ParseLocations(locRaw)
	if err != nil {
		return model.Snapshot{}, err
	}

	locCat, err := client.ListCatalogue("location")
	if err != nil {
		return model.Snapshot{}, err
	}
	chars, err := client.ListCharacters(campaignID)
	if err != nil {
		return model.Snapshot{}, err
	}

	sheets := map[string]*api.Character{}
	states := map[string]*api.CharacterState{}
	for _, ch := range chars {
		c, err := client.GetCharacter(campaignID, ch.ID)
		if err == nil {
			sheets[ch.ID] = c
		}
		st, err := client.GetCharacterState(campaignID, ch.ID)
		if err == nil {
			states[ch.ID] = st
		}
	}

	npcByID := map[string]map[string]any{}
	for _, ref := range cs.Party {
		if ref.Type != "npc" {
			continue
		}
		entry, err := client.GetCatalogue("npc", ref.ID)
		if err == nil {
			npcByID[ref.ID] = entry
		}
	}

	snap := model.BuildSnapshot(model.BuildInput{
		CampaignID:  campaignID,
		MapState:    ms,
		Campaign:    cs,
		Locations:   locs,
		LocationCat: locCat,
		Characters:  chars,
		CharSheets:  sheets,
		CharStates:  states,
		NPCByID:     npcByID,
	})
	return snap, nil
}

func applyMutation(client *api.Client, campaignID string, e model.Entity, mode editMode, raw string) error {
	switch mode {
	case editInit:
		v := 0.0
		s := strings.TrimSpace(raw)
		if s != "" {
			f, err := strconv.ParseFloat(s, 64)
			if err != nil {
				return err
			}
			v = f
		}
		patch := model.InitiativePatch(e.Key, e.Name, e.Kind, v)
		_, err := client.PatchDocument(campaignID, "map-state", patch)
		return err
	case editHP:
		if !e.EditableHP {
			return fmt.Errorf("HP read-only")
		}
		cur, max, err := model.ApplyHPInput(e.HPCurrent, e.HPMax, raw)
		if err != nil {
			return err
		}
		if e.Kind == "pc" && e.CharacterID != "" {
			body := map[string]any{}
			if cur != nil {
				body["hp_current"] = *cur
			}
			if max != nil {
				body["hp_max"] = *max
			}
			_, err := client.PutCharacterState(campaignID, e.CharacterID, body)
			return err
		}
		if e.Kind == "npc" && e.CatalogueID != "" {
			entry, err := client.GetCatalogue("npc", e.CatalogueID)
			if err != nil {
				return err
			}
			entry["hp"] = model.FormatNPCHealth(cur, max)
			_, err = client.PutCatalogue("npc", e.CatalogueID, entry)
			return err
		}
		return fmt.Errorf("unsupported HP target")
	case editCond:
		if !e.EditableCond {
			return fmt.Errorf("conditions read-only")
		}
		if e.Kind == "pc" && e.CharacterID != "" {
			_, err := client.PutCharacterState(campaignID, e.CharacterID, map[string]any{
				"conditions": model.TextToConditionsExport(raw),
			})
			return err
		}
		if e.Kind == "npc" && e.CatalogueID != "" {
			entry, err := client.GetCatalogue("npc", e.CatalogueID)
			if err != nil {
				return err
			}
			entry["combatConditions"] = strings.TrimSpace(raw)
			_, err = client.PutCatalogue("npc", e.CatalogueID, entry)
			return err
		}
		return fmt.Errorf("unsupported conditions target")
	case editAC:
		if !e.EditableAC {
			return fmt.Errorf("AC read-only")
		}
		f, err := strconv.ParseFloat(strings.TrimSpace(raw), 64)
		if err != nil {
			return err
		}
		if e.Kind == "pc" && e.CharacterID != "" {
			_, err := client.PatchCharacter(campaignID, e.CharacterID, map[string]any{"ac": f})
			return err
		}
		if e.Kind == "npc" && e.CatalogueID != "" {
			entry, err := client.GetCatalogue("npc", e.CatalogueID)
			if err != nil {
				return err
			}
			entry["ac"] = trimNum(f)
			_, err = client.PutCatalogue("npc", e.CatalogueID, entry)
			return err
		}
		return fmt.Errorf("unsupported AC target")
	default:
		return nil
	}
}

func (m *Model) View() string {
	if m.width < 40 || m.height < 12 {
		return "Terminal too small — resize to at least 40×12"
	}
	if m.screen == screenLogin {
		return m.viewLogin()
	}
	return m.viewTable()
}

var (
	titleStyle = lipgloss.NewStyle().Bold(true)
	dimStyle   = lipgloss.NewStyle().Faint(true)
	errStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("9"))
	selStyle   = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("10"))
	boxStyle   = lipgloss.NewStyle().Border(lipgloss.NormalBorder()).Padding(0, 1)
)

func (m *Model) viewLogin() string {
	var b strings.Builder
	b.WriteString(titleStyle.Render("Stormwreck DM — Terminal"))
	b.WriteString("\n")
	b.WriteString(dimStyle.Render("Tracker client · server is canonical · not a combat engine"))
	b.WriteString("\n\n")
	b.WriteString(fmt.Sprintf("Server:   %s\n", m.cfg.ServerURL))
	b.WriteString(fmt.Sprintf("Campaign: %s\n\n", m.cfg.CampaignID))
	b.WriteString("Email:\n")
	b.WriteString(m.emailInput.View())
	b.WriteString("\n\nPassword:\n")
	b.WriteString(m.passInput.View())
	b.WriteString("\n\n")
	b.WriteString(dimStyle.Render("Enter sign in · Tab switch field · Ctrl+C quit"))
	if m.errMsg != "" {
		b.WriteString("\n\n")
		b.WriteString(errStyle.Render(m.errMsg))
	}
	if m.conn == connConnecting {
		b.WriteString("\n\nConnecting…")
	}
	return b.String()
}

func (m *Model) viewTable() string {
	conn := "offline"
	switch m.conn {
	case connConnected:
		conn = "connected"
	case connRefreshing:
		conn = "refreshing"
	case connError:
		conn = "error"
	case connConnecting:
		conn = "connecting"
	}
	if m.stale {
		conn += " · STALE"
	}

	header := fmt.Sprintf("%s  [%s]  map:%s", m.cfg.CampaignID, conn, m.snap.ActiveMap)
	if m.snap.MapTitle != "" {
		header += " (" + m.snap.MapTitle + ")"
	}
	if !m.lastFetch.IsZero() {
		header += "  @" + m.lastFetch.Format("15:04:05")
	}

	mapH := max(6, m.height/3)
	mapW := max(20, m.width-4)
	mapView, _ := asciimap.Project(mapW, mapH, m.snap.GridSizeX, m.snap.GridSizeY, m.snap.Entities, m.selectedKey())

	var table strings.Builder
	table.WriteString(fmt.Sprintf("%-4s %-14s %-9s %-4s %-4s %s\n", "INIT", "NAME", "HP", "AC", "PP", "KIND"))
	for i, e := range m.snap.Entities {
		init := "—"
		if e.Initiative != 0 {
			init = trimNum(e.Initiative)
		}
		ac := "—"
		if e.AC != nil {
			ac = trimNum(*e.AC)
		}
		pp := "—"
		if e.PP != nil {
			pp = trimNum(*e.PP)
		}
		line := fmt.Sprintf("%-4s %-14s %-9s %-4s %-4s %s",
			init, truncate(e.Name, 14), model.FormatHP(e.HPCurrent, e.HPMax), ac, pp, e.Kind)
		if i == m.selected {
			line = selStyle.Render("▶ " + line)
		} else {
			line = "  " + line
		}
		table.WriteString(line)
		table.WriteByte('\n')
	}
	if len(m.snap.Entities) == 0 {
		table.WriteString(dimStyle.Render("  (no party / tokens / initiative yet)"))
		table.WriteByte('\n')
	}

	detail := "(nothing selected)"
	if e := m.selectedEntity(); e != nil {
		detail = fmt.Sprintf("%s [%s]\nHP %s  AC %s  PP %s  Init %s\nConditions: %s\nFlags: hp=%v ac=%v cond=%v  mapPos=%v",
			e.Name, e.Kind,
			model.FormatHP(e.HPCurrent, e.HPMax),
			fmtAC(e.AC), fmtAC(e.PP),
			fmtInit(e.Initiative),
			emptyDash(e.Conditions),
			e.EditableHP, e.EditableAC, e.EditableCond, e.OnActiveMap && e.HasWorldPos,
		)
	}

	hints := "↑↓/jk select · h HP · i init · c conditions · a AC · r refresh · q quit"
	if m.edit != editNone {
		hints = m.editInput.View() + "  (Enter save · Esc cancel)"
	}

	body := strings.Join([]string{
		titleStyle.Render(header),
		boxStyle.Width(m.width - 2).Render(mapView),
		strings.TrimRight(table.String(), "\n"),
		boxStyle.Width(m.width - 2).Render(detail),
		dimStyle.Render(hints),
	}, "\n")
	if m.errMsg != "" {
		body += "\n" + errStyle.Render(m.errMsg)
	}
	return body
}

func (m *Model) selectedKey() string {
	if e := m.selectedEntity(); e != nil {
		return e.Key
	}
	return ""
}

func trimNum(f float64) string {
	if f == float64(int64(f)) {
		return strconv.FormatInt(int64(f), 10)
	}
	return strconv.FormatFloat(f, 'f', 1, 64)
}

func truncate(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n-1]) + "…"
}

func fmtAC(v *float64) string {
	if v == nil {
		return "—"
	}
	return trimNum(*v)
}

func fmtInit(v float64) string {
	if v == 0 {
		return "—"
	}
	return trimNum(v)
}

func emptyDash(s string) string {
	if strings.TrimSpace(s) == "" {
		return "—"
	}
	return s
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
