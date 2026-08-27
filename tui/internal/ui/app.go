package ui

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/api"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/config"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/model"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/music"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/nav"
	"github.com/AZumD/stormwreck-dm-screen/tui/internal/scene"
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
	screenHome
	screenLibraryList
	screenCatalogueDetail
	screenCampaign
)

type campaignTab int

const (
	tabScene campaignTab = iota
	tabNotes
	tabParty
	tabMap
	tabMusic
)

type scenePane int

const (
	scenePaneNav scenePane = iota
	scenePaneBody
	scenePaneParty
)

type overlayKind int

const (
	overlayNone overlayKind = iota
	overlayLibrary
	overlayCharSheet
	overlayCatalogue
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
type loginResultMsg struct {
	user         string
	memberships []api.Membership
	err         error
}
type homeLoadedMsg struct {
	types     []string
	campaigns []api.Campaign
	err       error
}
type libraryLoadedMsg struct {
	typ     string
	entries []map[string]any
	err     error
}
type catalogueLoadedMsg struct {
	typ   string
	entry map[string]any
	err   error
}
type campaignOpenedMsg struct {
	id    string
	title string
	snap  model.Snapshot
	scene *sceneBundle
	notes string
	music []musicTrackRow
	err   error
}
type sceneBundle struct {
	list   *api.SceneList
	detail *api.SceneDetail
	blocks []scene.Block
	refs   []scene.Ref
}
type sceneLoadedMsg struct {
	bundle *sceneBundle
	err    error
}
type notesSavedMsg struct {
	err error
}
type sheetLoadedMsg struct {
	char  *api.Character
	state *api.CharacterState
	err   error
}

type Model struct {
	cfg      config.Config
	password string
	client   *api.Client
	player   *music.Player

	screen screen
	conn   connState
	status string
	errMsg string
	user   string

	emailInput  textinput.Model
	passInput   textinput.Model
	editInput   textinput.Model
	searchInput textinput.Model
	notesInput  textinput.Model
	focusPass   bool
	searching   bool
	editingNotes bool

	history nav.Stack

	// home
	catalogueTypes []string
	campaigns      []api.Campaign
	homeRows       []HomeRow
	homeCursor     int

	// library
	libType    string
	libEntries []map[string]any
	libCursor  int
	libDetail  map[string]any
	libDetailT string
	detailLinks  []sheetLink
	detailCursor int

	memberships []api.Membership

	// campaign
	campaignID    string
	campaignTitle string
	tab           campaignTab
	overlay       overlayKind
	snap          model.Snapshot
	selected      int

	// scene
	sceneList   *api.SceneList
	sceneDetail *api.SceneDetail
	sceneBlocks []scene.Block
	sceneRefs   []scene.Ref
	sceneRefSel int
	scenePane   scenePane // nav | body | party
	sceneListCursor  int
	scenePartyCursor int
	sceneBodyScroll   int // line offset into scene body pane
	sceneBodyLines    int // last rendered full line count
	sceneBodyViewport int // last visible line budget
	sceneNavScroll    int // line offset into SCENES list (below fixed search header)

	// notes
	notesText string

	// music
	musicTracks []musicTrackRow
	musicCursor int
	musicVol    float64
	musicLoop   bool
	nowPlaying  string

	// character sheet
	sheetChar  *api.Character
	sheetState *api.CharacterState
	sheetCursor int
	sheetLinks  []sheetLink

	width  int
	height int

	refreshing bool
	lastFetch  time.Time
	stale      bool
	edit       editMode
}

type sheetLink struct {
	Label string
	Type  string
	ID    string
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

	si := textinput.New()
	si.Placeholder = "filter…"
	si.CharLimit = 120
	si.Width = 32

	ni := textinput.New()
	ni.Placeholder = "notes"
	ni.CharLimit = 8000
	ni.Width = 60

	m := &Model{
		cfg:         cfg,
		password:    password,
		client:      client,
		player:      &music.Player{},
		screen:      screenLogin,
		conn:        connOffline,
		emailInput:  ei,
		passInput:   pi,
		editInput:   ed,
		searchInput: si,
		notesInput:  ni,
		width:       80,
		height:      40,
		musicVol:    70,
		tab:         tabScene,
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
		if m.screen == screenCampaign && m.overlay == overlayNone && !m.refreshing && m.conn != connUnauthorized {
			return m, m.cmdRefresh(true)
		}
		return m, m.scheduleTick()
	case refreshDoneMsg:
		m.refreshing = false
		if msg.err != nil {
			if msg.err == api.ErrUnauthorized {
				return m.forceLogin("Session expired — sign in again")
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
		m.selected = clampIndex(m.selected, len(m.snap.Entities))
		return m, m.scheduleTick()
	case mutateDoneMsg:
		if msg.err != nil {
			if msg.err == api.ErrUnauthorized {
				return m.forceLogin("Session expired — sign in again")
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
		m.password = ""
		m.user = msg.user
		m.memberships = msg.memberships
		m.conn = connConnected
		m.status = fmt.Sprintf("Signed in as %s", msg.user)
		if m.cfg.CampaignID != "" {
			return m, m.cmdOpenCampaign(m.cfg.CampaignID)
		}
		m.screen = screenHome
		return m, tea.Batch(m.cmdLoadHome(), m.scheduleTick())
	case homeLoadedMsg:
		if msg.err != nil {
			if msg.err == api.ErrUnauthorized {
				return m.forceLogin("Session expired — sign in again")
			}
			m.errMsg = msg.err.Error()
			return m, nil
		}
		m.catalogueTypes = ResolveCatalogueTypes(msg.types)
		m.campaigns = MergeHomeCampaigns(msg.campaigns, m.memberships)
		m.rebuildHomeRows()
		return m, nil
	case libraryLoadedMsg:
		if msg.err != nil {
			m.errMsg = msg.err.Error()
			return m, nil
		}
		m.libType = msg.typ
		m.libEntries = msg.entries
		m.libCursor = clampIndex(m.libCursor, len(m.filteredLibEntries()))
		return m, nil
	case catalogueLoadedMsg:
		if msg.err != nil {
			m.errMsg = msg.err.Error()
			return m, nil
		}
		m.libDetail = msg.entry
		m.libDetailT = msg.typ
		m.detailLinks = buildEntryLinks(msg.entry, msg.typ)
		m.detailCursor = 0
		return m, nil
	case campaignOpenedMsg:
		if msg.err != nil {
			if msg.err == api.ErrUnauthorized {
				return m.forceLogin("Session expired — sign in again")
			}
			m.errMsg = msg.err.Error()
			m.screen = screenHome
			return m, m.cmdLoadHome()
		}
		m.campaignID = msg.id
		m.campaignTitle = msg.title
		m.snap = msg.snap
		m.applySceneBundle(msg.scene)
		m.notesText = msg.notes
		m.notesInput.SetValue(msg.notes)
		m.musicTracks = msg.music
		m.screen = screenCampaign
		m.tab = tabScene
		m.overlay = overlayNone
		m.conn = connConnected
		m.lastFetch = time.Now()
		m.selected = 0
		return m, m.scheduleTick()
	case sceneLoadedMsg:
		if msg.err != nil {
			m.errMsg = msg.err.Error()
			return m, nil
		}
		m.applySceneBundle(msg.bundle)
		return m, nil
	case notesSavedMsg:
		if msg.err != nil {
			m.errMsg = msg.err.Error()
			return m, nil
		}
		m.errMsg = ""
		m.status = "Notes saved"
		return m, nil
	case sheetLoadedMsg:
		if msg.err != nil {
			m.errMsg = msg.err.Error()
			return m, nil
		}
		m.sheetChar = msg.char
		m.sheetState = msg.state
		m.sheetLinks = buildSheetLinks(msg.char)
		m.sheetCursor = 0
		m.overlay = overlayCharSheet
		return m, nil
	}
	return m, nil
}

func (m *Model) forceLogin(msg string) (tea.Model, tea.Cmd) {
	m.conn = connUnauthorized
	m.screen = screenLogin
	m.errMsg = msg
	m.password = ""
	m.overlay = overlayNone
	return m, nil
}

func (m *Model) applySceneBundle(b *sceneBundle) {
	if b == nil {
		return
	}
	m.sceneList = b.list
	m.sceneDetail = b.detail
	m.sceneBlocks = b.blocks
	m.sceneRefs = b.refs
	m.sceneRefSel = clampIndex(m.sceneRefSel, len(m.sceneRefs))
	m.sceneBodyScroll = 0
	m.syncSceneListCursor()
}

func (m *Model) rebuildHomeRows() {
	hc := make([]HomeCampaign, 0, len(m.campaigns))
	for _, c := range m.campaigns {
		hc = append(hc, HomeCampaign{ID: c.ID, Title: c.Title})
	}
	q := ""
	if m.searching {
		q = m.searchInput.Value()
	}
	m.homeRows = BuildHomeRows(m.catalogueTypes, hc, q)
	m.homeCursor = clampIndex(m.homeCursor, len(m.homeRows))
}

func (m *Model) filteredLibEntries() []map[string]any {
	q := ""
	if m.searching {
		q = m.searchInput.Value()
	}
	return FilterCatalogueEntries(m.libEntries, q)
}

func (m *Model) isEditing() bool {
	return m.edit != editNone || m.searching || m.editingNotes || m.screen == screenLogin
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
		return loginResultMsg{user: res.User.Email, memberships: res.Memberships}
	}
}

func (m *Model) cmdLoadHome() tea.Cmd {
	client := m.client
	return func() tea.Msg {
		h, err := client.Health()
		types := []string{}
		if err == nil && h != nil {
			types = h.CatalogueTypes
		}
		camps, err2 := client.ListCampaigns()
		if err2 != nil {
			return homeLoadedMsg{types: types, err: err2}
		}
		return homeLoadedMsg{types: types, campaigns: camps}
	}
}

func (m *Model) cmdLoadLibrary(typ string) tea.Cmd {
	client := m.client
	return func() tea.Msg {
		entries, err := client.ListCatalogue(typ)
		return libraryLoadedMsg{typ: typ, entries: entries, err: err}
	}
}

func (m *Model) cmdLoadCatalogue(typ, id string) tea.Cmd {
	client := m.client
	return func() tea.Msg {
		entry, err := client.GetCatalogue(typ, id)
		return catalogueLoadedMsg{typ: typ, entry: entry, err: err}
	}
}

func (m *Model) cmdOpenCampaign(id string) tea.Cmd {
	client := m.client
	return func() tea.Msg {
		camp, err := client.GetCampaign(id)
		title := id
		if err == nil && camp != nil && camp.Title != "" {
			title = camp.Title
		}
		snap, err := fetchSnapshot(client, id)
		if err != nil {
			return campaignOpenedMsg{err: err}
		}
		bundle, _ := loadSceneBundle(client, id)
		notesRaw, _ := client.GetDocument(id, "notes")
		mixerRaw, _ := client.GetDocument(id, "music-mixer")
		musicCat, _ := client.ListCatalogue("music")
		byID := map[string]map[string]any{}
		for _, e := range musicCat {
			if eid, _ := e["id"].(string); eid != "" {
				byID[eid] = e
			}
		}
		return campaignOpenedMsg{
			id:    id,
			title: title,
			snap:  snap,
			scene: bundle,
			notes: parseNotesText(notesRaw),
			music: parseMusicMixerTracks(mixerRaw, byID),
		}
	}
}

func loadSceneBundle(client *api.Client, campaignID string) (*sceneBundle, error) {
	list, err := client.ListScenes(campaignID)
	if err != nil {
		return nil, err
	}
	b := &sceneBundle{list: list}
	sid := list.CurrentSceneID
	if sid == "" && len(list.Scenes) > 0 {
		sid = list.Scenes[0].ID
	}
	if sid == "" {
		return b, nil
	}
	return fillSceneDetail(client, campaignID, b, sid)
}

func fillSceneDetail(client *api.Client, campaignID string, b *sceneBundle, sceneID string) (*sceneBundle, error) {
	if b == nil {
		b = &sceneBundle{}
	}
	detail, err := client.GetScene(campaignID, sceneID)
	if err != nil {
		return b, err
	}
	b.detail = detail
	var blocks []scene.Block
	if detail != nil && len(detail.Blocks) > 0 {
		_ = json.Unmarshal(detail.Blocks, &blocks)
	}
	b.blocks = blocks
	b.refs = scene.FlattenRefs(blocks)
	return b, nil
}

func (m *Model) cmdLoadSceneByID(sceneID string) tea.Cmd {
	client := m.client
	campaign := m.campaignID
	list := m.sceneList
	return func() tea.Msg {
		b := &sceneBundle{list: list}
		filled, err := fillSceneDetail(client, campaign, b, sceneID)
		return sceneLoadedMsg{bundle: filled, err: err}
	}
}

func (m *Model) cmdRefresh(background bool) tea.Cmd {
	if m.refreshing || m.campaignID == "" {
		return nil
	}
	m.refreshing = true
	if background {
		m.conn = connRefreshing
	}
	client := m.client
	campaign := m.campaignID
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
	campaign := m.campaignID
	ent := *e
	return func() tea.Msg {
		err := applyMutation(client, campaign, ent, mode, raw)
		return mutateDoneMsg{err: err}
	}
}

func (m *Model) cmdSaveNotes() tea.Cmd {
	client := m.client
	campaign := m.campaignID
	text := m.notesInput.Value()
	return func() tea.Msg {
		_, err := client.PutDocument(campaign, "notes", map[string]any{"text": text})
		return notesSavedMsg{err: err}
	}
}

func (m *Model) cmdLoadSheet(characterID string) tea.Cmd {
	client := m.client
	campaign := m.campaignID
	return func() tea.Msg {
		ch, err := client.GetCharacter(campaign, characterID)
		if err != nil {
			return sheetLoadedMsg{err: err}
		}
		st, _ := client.GetCharacterState(campaign, characterID)
		return sheetLoadedMsg{char: ch, state: st}
	}
}

func (m *Model) selectedEntity() *model.Entity {
	if m.selected < 0 || m.selected >= len(m.snap.Entities) {
		return nil
	}
	return &m.snap.Entities[m.selected]
}

func (m *Model) selectedKey() string {
	if e := m.selectedEntity(); e != nil {
		return e.Key
	}
	return ""
}

func (m *Model) View() string {
	if m.width < 40 || m.height < 12 {
		return "Terminal too small — resize to at least 40×12"
	}
	switch m.screen {
	case screenLogin:
		return m.viewLogin()
	case screenHome:
		return m.viewHome()
	case screenLibraryList:
		return m.viewLibraryList()
	case screenCatalogueDetail:
		return m.viewCatalogueDetail()
	case screenCampaign:
		if m.overlay == overlayLibrary {
			return m.viewLibraryList()
		}
		if m.overlay == overlayCatalogue {
			return m.viewCatalogueDetail()
		}
		if m.overlay == overlayCharSheet {
			return m.viewCharSheet()
		}
		return m.viewCampaign()
	default:
		return m.viewLogin()
	}
}
