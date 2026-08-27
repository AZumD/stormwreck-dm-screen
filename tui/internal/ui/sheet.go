package ui

import (
	"fmt"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/api"
)

var catalogueRefRE = regexp.MustCompile(`(?i)^@?(pc|npc|race|class|skill|feature|spell|item|monster|location|music|source):([a-zA-Z0-9][a-zA-Z0-9._-]{0,127})(?:\|([^@\n]*))?$`)

// BuiltinCampaign is always offered on Home (matches the browser DM landing card).
var BuiltinCampaign = api.Campaign{
	ID:          "stormwreck-isle",
	Title:       "Dragons of Stormwreck Isle",
	Description: "Built-in starter set campaign",
	Level:       "1–3",
	BuiltIn:     true,
}

// MergeHomeCampaigns combines the registry list with the built-in Stormwreck campaign
// and any DM memberships that are missing from the FS index (common on production).
func MergeHomeCampaigns(listed []api.Campaign, memberships []api.Membership) []api.Campaign {
	byID := make(map[string]api.Campaign, len(listed)+2)
	order := make([]string, 0, len(listed)+2)

	ensure := func(c api.Campaign) {
		if c.ID == "" {
			return
		}
		if _, ok := byID[c.ID]; ok {
			// Prefer richer title from listed entry
			prev := byID[c.ID]
			if prev.Title == "" && c.Title != "" {
				byID[c.ID] = c
			} else if prev.Title == c.ID && c.Title != "" && c.Title != c.ID {
				byID[c.ID] = c
			}
			return
		}
		byID[c.ID] = c
		order = append(order, c.ID)
	}

	ensure(BuiltinCampaign)
	for _, c := range listed {
		ensure(c)
	}
	for _, m := range memberships {
		if !strings.EqualFold(strings.TrimSpace(m.Role), "dm") {
			continue
		}
		id := strings.TrimSpace(m.CampaignID)
		if id == "" {
			continue
		}
		ensure(api.Campaign{ID: id, Title: id})
	}

	out := make([]api.Campaign, 0, len(order))
	for _, id := range order {
		out = append(out, byID[id])
	}
	return out
}

// ParseCatalogueRef parses "@type:id|Label" / "type:id|Label".
func ParseCatalogueRef(raw string) (typ, id, label string, ok bool) {
	s := strings.TrimSpace(raw)
	m := catalogueRefRE.FindStringSubmatch(s)
	if m == nil {
		return "", "", "", false
	}
	return strings.ToLower(m[1]), m[2], strings.TrimSpace(m[3]), true
}

// FormatCatalogueDetail renders a full catalogue entry for the detail page.
func FormatCatalogueDetail(entry map[string]any, typ string) string {
	if entry == nil {
		return "(empty)"
	}
	switch strings.ToLower(typ) {
	case "pc":
		return FormatPCSheet(entry, nil)
	case "source":
		return FormatSourceDetail(entry)
	case "monster", "npc":
		return FormatStatblock(entry, typ)
	case "spell":
		return FormatSpellDetail(entry)
	case "item":
		return FormatItemDetail(entry)
	default:
		return FormatGenericDetail(entry, typ)
	}
}

// FormatPCSheet renders a terminal character sheet from catalogue or character.sheet JSON.
// live may supply current/max HP overlay (character state); nil is fine for catalogue browse.
func FormatPCSheet(entry map[string]any, live *api.CharacterState) string {
	if entry == nil {
		return "(empty)"
	}
	var b strings.Builder
	name := strings.TrimSpace(strField(entry, "name", "title"))
	if name == "" {
		name = strField(entry, "id")
	}
	b.WriteString(strings.ToUpper(name))
	b.WriteByte('\n')

	race := strField(entry, "race")
	class := strField(entry, "class")
	level := anyString(entry["level"])
	var identity []string
	if race != "" {
		identity = append(identity, race)
	}
	if class != "" {
		if level != "" {
			identity = append(identity, class+" "+level)
		} else {
			identity = append(identity, class)
		}
	} else if level != "" {
		identity = append(identity, "Level "+level)
	}
	if len(identity) > 0 {
		b.WriteString(strings.Join(identity, " · "))
		b.WriteByte('\n')
	}
	if bg := strField(entry, "background"); bg != "" {
		b.WriteString("Background: ")
		b.WriteString(bg)
		b.WriteByte('\n')
	}
	if loc := strField(entry, "location", "activeCampaign"); loc != "" {
		// prefer location; show campaign if present
		if l := strField(entry, "location"); l != "" {
			b.WriteString("Location: ")
			b.WriteString(l)
			b.WriteByte('\n')
		}
		if camp := strField(entry, "activeCampaign"); camp != "" {
			b.WriteString("Campaign: ")
			b.WriteString(camp)
			b.WriteByte('\n')
		}
	}

	b.WriteByte('\n')
	hpCur, hpMax := entry["hpCurrent"], entry["hpMax"]
	if live != nil {
		if live.HPCurrent != nil {
			hpCur = *live.HPCurrent
		}
		if live.HPMax != nil {
			hpMax = *live.HPMax
		}
	}
	vitals := []string{}
	if hp := formatHPPair(hpCur, hpMax); hp != "" {
		vitals = append(vitals, "HP "+hp)
	}
	if ac := anyString(entry["ac"]); ac != "" {
		vitals = append(vitals, "AC "+ac)
	}
	if spd := strField(entry, "speed"); spd != "" {
		vitals = append(vitals, "Speed "+spd)
	}
	if pb := strField(entry, "proficiencyBonus"); pb != "" {
		vitals = append(vitals, "Prof "+pb)
	}
	if hd := strField(entry, "hitDice"); hd != "" {
		vitals = append(vitals, "HD "+hd)
	}
	if len(vitals) > 0 {
		b.WriteString(strings.Join(vitals, " · "))
		b.WriteByte('\n')
	}

	abs := formatAbilities(entry)
	if abs != "" {
		b.WriteByte('\n')
		b.WriteString(abs)
		b.WriteByte('\n')
	}

	writeLabeledList(&b, "Skills", collectRefLabels(entry, "skillRefs", "skills"))
	writeLabeledList(&b, "Features", collectRefLabels(entry, "featureRefs", "features", "featuresSpells"))
	writeLabeledList(&b, "Spells", collectRefLabels(entry, "spellRefs", "spells"))
	writeLabeledList(&b, "Equipment", collectRefLabels(entry, "equipment", "inventory"))

	if saves := strField(entry, "savingThrows"); saves != "" {
		b.WriteByte('\n')
		b.WriteString("Saves: ")
		b.WriteString(saves)
		b.WriteByte('\n')
	}
	if langs := strField(entry, "languages"); langs != "" {
		b.WriteString("Languages: ")
		b.WriteString(langs)
		b.WriteByte('\n')
	}
	if notes := strField(entry, "notes", "backstory"); notes != "" {
		b.WriteByte('\n')
		b.WriteString("Notes\n")
		b.WriteString(notes)
		b.WriteByte('\n')
	}
	return strings.TrimRight(b.String(), "\n")
}

func formatAbilities(entry map[string]any) string {
	keys := []string{"str", "dex", "con", "int", "wis", "cha"}
	labels := []string{"STR", "DEX", "CON", "INT", "WIS", "CHA"}
	parts := make([]string, 0, 6)
	anySet := false
	for i, k := range keys {
		v, ok := entry[k]
		if !ok || v == nil {
			continue
		}
		anySet = true
		score := int(toFloat(v))
		mod := abilityMod(score)
		sign := "+"
		if mod < 0 {
			sign = ""
		}
		parts = append(parts, fmt.Sprintf("%s %d (%s%d)", labels[i], score, sign, mod))
	}
	if !anySet {
		return ""
	}
	return strings.Join(parts, "  ")
}

func formatHPPair(cur, max any) string {
	c, cok := toFloatOK(cur)
	m, mok := toFloatOK(max)
	switch {
	case cok && mok:
		return fmt.Sprintf("%.0f/%.0f", c, m)
	case cok:
		return fmt.Sprintf("%.0f", c)
	case mok:
		return fmt.Sprintf("—/%.0f", m)
	default:
		if s := anyString(cur); s != "" {
			return s
		}
		return ""
	}
}

func writeLabeledList(b *strings.Builder, title string, items []string) {
	if len(items) == 0 {
		return
	}
	b.WriteByte('\n')
	b.WriteString(title)
	b.WriteByte('\n')
	for _, it := range items {
		b.WriteString("  · ")
		b.WriteString(it)
		b.WriteByte('\n')
	}
}

func collectRefLabels(entry map[string]any, keys ...string) []string {
	var out []string
	seen := map[string]bool{}
	for _, key := range keys {
		v, ok := entry[key]
		if !ok || v == nil {
			continue
		}
		switch t := v.(type) {
		case string:
			s := strings.TrimSpace(t)
			if s == "" {
				continue
			}
			if typ, id, label, ok := ParseCatalogueRef(s); ok {
				name := label
				if name == "" {
					name = id
				}
				key := typ + ":" + id
				if !seen[key] {
					seen[key] = true
					out = append(out, name)
				}
			} else if !seen[s] {
				seen[s] = true
				out = append(out, s)
			}
		case []any:
			for _, item := range t {
				switch it := item.(type) {
				case string:
					s := strings.TrimSpace(it)
					if s == "" {
						continue
					}
					if typ, id, label, ok := ParseCatalogueRef(s); ok {
						name := label
						if name == "" {
							name = id
						}
						key := typ + ":" + id
						if !seen[key] {
							seen[key] = true
							out = append(out, name)
						}
					} else if !seen[s] {
						seen[s] = true
						out = append(out, s)
					}
				case map[string]any:
					name := strField(it, "name", "title", "label")
					id := strField(it, "id")
					if name == "" {
						name = id
					}
					if name == "" || seen[name] {
						continue
					}
					seen[name] = true
					out = append(out, name)
				}
			}
		}
	}
	return out
}

// FormatSourceDetail renders source catalogue chapters for terminal reading.
func FormatSourceDetail(entry map[string]any) string {
	if entry == nil {
		return "(empty)"
	}
	var b strings.Builder
	name := strField(entry, "name", "title")
	if name == "" {
		name = strField(entry, "id")
	}
	b.WriteString(name)
	b.WriteByte('\n')
	if cat := strField(entry, "category", "kind"); cat != "" {
		b.WriteString(cat)
		b.WriteByte('\n')
	}
	if sum := strField(entry, "summary", "description"); sum != "" {
		b.WriteByte('\n')
		b.WriteString(sum)
		b.WriteByte('\n')
	}

	chapters := normalizeChapters(entry["chapters"])
	if len(chapters) == 0 {
		b.WriteByte('\n')
		b.WriteString("(No chapters yet — add them in the browser Source catalogue.)")
		return b.String()
	}
	for i, ch := range chapters {
		b.WriteByte('\n')
		b.WriteString("── ")
		b.WriteString(ch.Title)
		b.WriteString(" ──\n")
		if strings.TrimSpace(ch.Content) != "" {
			b.WriteString(formatSourceMarkup(ch.Content))
			b.WriteByte('\n')
		}
		for _, sub := range ch.Subs {
			b.WriteByte('\n')
			b.WriteString("  ▸ ")
			b.WriteString(sub.Title)
			b.WriteByte('\n')
			if strings.TrimSpace(sub.Content) != "" {
				b.WriteString(indentBlock(formatSourceMarkup(sub.Content), "    "))
				b.WriteByte('\n')
			}
		}
		if i < len(chapters)-1 {
			b.WriteByte('\n')
		}
	}
	return strings.TrimRight(b.String(), "\n")
}

type sourceChapter struct {
	Title   string
	Content string
	Subs    []sourceChapter
}

func normalizeChapters(raw any) []sourceChapter {
	switch t := raw.(type) {
	case string:
		s := strings.TrimSpace(t)
		if s == "" {
			return nil
		}
		return []sourceChapter{{Title: "Body", Content: s}}
	case []any:
		out := make([]sourceChapter, 0, len(t))
		for _, item := range t {
			m, ok := item.(map[string]any)
			if !ok {
				continue
			}
			ch := sourceChapter{
				Title:   strField(m, "title", "name"),
				Content: strField(m, "content", "text", "body"),
			}
			if ch.Title == "" {
				ch.Title = "Untitled chapter"
			}
			if subs, ok := m["subchapters"].([]any); ok {
				for _, s := range subs {
					sm, ok := s.(map[string]any)
					if !ok {
						continue
					}
					sub := sourceChapter{
						Title:   strField(sm, "title", "name"),
						Content: strField(sm, "content", "text", "body"),
					}
					if sub.Title == "" {
						sub.Title = "Untitled section"
					}
					ch.Subs = append(ch.Subs, sub)
				}
			}
			out = append(out, ch)
		}
		return out
	default:
		return nil
	}
}

// formatSourceMarkup lightly presents scene-style markers without HTML.
func formatSourceMarkup(raw string) string {
	s := strings.TrimSpace(raw)
	if s == "" {
		return ""
	}
	s = strings.ReplaceAll(s, "{{read-aloud}}", "── READ ALOUD ──\n")
	s = strings.ReplaceAll(s, "{{/read-aloud}}", "")
	s = strings.ReplaceAll(s, "{{dm-note}}", "── DM NOTE ──\n")
	s = strings.ReplaceAll(s, "{{/dm-note}}", "")
	// collapse open tags → title line
	reCollapse := regexp.MustCompile(`(?i)\{\{collapse(?::\s*([^}]*))?\}\}`)
	s = reCollapse.ReplaceAllStringFunc(s, func(m string) string {
		sub := reCollapse.FindStringSubmatch(m)
		title := "Details"
		if len(sub) > 1 && strings.TrimSpace(sub[1]) != "" {
			title = strings.TrimSpace(sub[1])
		}
		return "▼ " + title + "\n"
	})
	s = regexp.MustCompile(`(?i)\{\{/collapse\}\}`).ReplaceAllString(s, "")
	s = regexp.MustCompile(`(?i)\{\{youtube:[^}]+\}\}`).ReplaceAllString(s, "")
	return strings.TrimSpace(s)
}

func indentBlock(text, prefix string) string {
	lines := strings.Split(text, "\n")
	for i, line := range lines {
		lines[i] = prefix + line
	}
	return strings.Join(lines, "\n")
}

// FormatStatblock renders monster/NPC combat-facing fields.
func FormatStatblock(entry map[string]any, typ string) string {
	var b strings.Builder
	name := strField(entry, "name", "title")
	b.WriteString(name)
	if typ != "" {
		b.WriteString(" [")
		b.WriteString(typ)
		b.WriteByte(']')
	}
	b.WriteByte('\n')
	meta := []string{}
	for _, k := range []string{"size", "type", "alignment", "cr", "challenge"} {
		if v := anyString(entry[k]); v != "" {
			meta = append(meta, v)
		}
	}
	if len(meta) > 0 {
		b.WriteString(strings.Join(meta, " · "))
		b.WriteByte('\n')
	}
	line := []string{}
	if ac := anyString(entry["ac"]); ac != "" {
		line = append(line, "AC "+ac)
	}
	if hp := anyString(entry["hp"]); hp != "" {
		line = append(line, "HP "+hp)
	} else if h := formatHPPair(entry["hpCurrent"], entry["hpMax"]); h != "" {
		line = append(line, "HP "+h)
	}
	if spd := strField(entry, "speed"); spd != "" {
		line = append(line, "Speed "+spd)
	}
	if len(line) > 0 {
		b.WriteString(strings.Join(line, " · "))
		b.WriteByte('\n')
	}
	if abs := formatAbilities(entry); abs != "" {
		b.WriteByte('\n')
		b.WriteString(abs)
		b.WriteByte('\n')
	}
	for _, k := range []string{"traits", "actions", "reactions", "legendaryActions", "description", "notes", "summary"} {
		if s := strField(entry, k); s != "" {
			b.WriteByte('\n')
			b.WriteString(strings.ToUpper(k[:1]) + k[1:])
			b.WriteByte('\n')
			b.WriteString(s)
			b.WriteByte('\n')
		}
	}
	return strings.TrimRight(b.String(), "\n")
}

// FormatSpellDetail renders spell fields present on the entry.
func FormatSpellDetail(entry map[string]any) string {
	var b strings.Builder
	b.WriteString(strField(entry, "name", "title"))
	b.WriteByte('\n')
	bits := []string{}
	if lvl := anyString(entry["level"]); lvl != "" {
		bits = append(bits, "Level "+lvl)
	}
	if school := strField(entry, "school"); school != "" {
		bits = append(bits, school)
	}
	if len(bits) > 0 {
		b.WriteString(strings.Join(bits, " · "))
		b.WriteByte('\n')
	}
	for _, k := range []string{"castingTime", "range", "components", "duration", "description", "notes"} {
		if s := strField(entry, k); s != "" {
			b.WriteString(k)
			b.WriteString(": ")
			b.WriteString(s)
			b.WriteByte('\n')
		}
	}
	return strings.TrimRight(b.String(), "\n")
}

// FormatItemDetail renders item fields present on the entry.
func FormatItemDetail(entry map[string]any) string {
	var b strings.Builder
	b.WriteString(strField(entry, "name", "title"))
	b.WriteByte('\n')
	bits := []string{}
	for _, k := range []string{"itemType", "type", "rarity"} {
		if s := strField(entry, k); s != "" {
			bits = append(bits, s)
			break
		}
	}
	if r := strField(entry, "rarity"); r != "" && !strings.Contains(strings.Join(bits, ""), r) {
		bits = append(bits, r)
	}
	if len(bits) > 0 {
		b.WriteString(strings.Join(bits, " · "))
		b.WriteByte('\n')
	}
	for _, k := range []string{"value", "weight", "attunement", "description", "properties", "notes", "summary"} {
		if v, ok := entry[k]; ok && v != nil {
			s := anyString(v)
			if s == "" {
				continue
			}
			b.WriteString(k)
			b.WriteString(": ")
			b.WriteString(s)
			b.WriteByte('\n')
		}
	}
	return strings.TrimRight(b.String(), "\n")
}

// FormatGenericDetail dumps useful scalar / list fields without inventing data.
func FormatGenericDetail(entry map[string]any, typ string) string {
	var b strings.Builder
	name := strField(entry, "name", "title")
	b.WriteString(name)
	if typ != "" {
		b.WriteString(" [")
		b.WriteString(typ)
		b.WriteByte(']')
	}
	b.WriteByte('\n')
	if id := strField(entry, "id"); id != "" {
		b.WriteString("id: ")
		b.WriteString(id)
		b.WriteByte('\n')
	}
	keys := make([]string, 0, len(entry))
	for k := range entry {
		switch k {
		case "id", "name", "title", "portrait", "image", "mapImage", "updatedAt", "createdAt":
			continue
		}
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		v := entry[k]
		switch t := v.(type) {
		case string:
			if strings.TrimSpace(t) == "" {
				continue
			}
			b.WriteString(k)
			b.WriteString(": ")
			b.WriteString(truncate(t, 400))
			b.WriteByte('\n')
		case float64, bool, int, int64:
			b.WriteString(k)
			b.WriteString(": ")
			b.WriteString(anyString(t))
			b.WriteByte('\n')
		case []any:
			labels := collectRefLabels(map[string]any{k: t}, k)
			if len(labels) == 0 {
				continue
			}
			b.WriteString(k)
			b.WriteByte('\n')
			for _, l := range labels {
				b.WriteString("  · ")
				b.WriteString(l)
				b.WriteByte('\n')
			}
		}
	}
	return strings.TrimRight(b.String(), "\n")
}

// FormatInspector renders a compact preview (list selection pane).
func FormatInspector(entry map[string]any, typ string) string {
	if entry == nil {
		return "(nothing selected)"
	}
	switch strings.ToLower(typ) {
	case "pc":
		name := strings.TrimSpace(strField(entry, "name", "title"))
		var b strings.Builder
		b.WriteString(name)
		b.WriteByte('\n')
		line := []string{}
		if r := strField(entry, "race"); r != "" {
			line = append(line, r)
		}
		if c := strField(entry, "class"); c != "" {
			if lvl := anyString(entry["level"]); lvl != "" {
				line = append(line, c+" "+lvl)
			} else {
				line = append(line, c)
			}
		}
		if len(line) > 0 {
			b.WriteString(strings.Join(line, " · "))
			b.WriteByte('\n')
		}
		vitals := []string{}
		if hp := formatHPPair(entry["hpCurrent"], entry["hpMax"]); hp != "" {
			vitals = append(vitals, "HP "+hp)
		}
		if ac := anyString(entry["ac"]); ac != "" {
			vitals = append(vitals, "AC "+ac)
		}
		if len(vitals) > 0 {
			b.WriteString(strings.Join(vitals, " · "))
		}
		return strings.TrimRight(b.String(), "\n")
	case "source":
		var b strings.Builder
		b.WriteString(strField(entry, "name", "title"))
		b.WriteByte('\n')
		if cat := strField(entry, "category", "kind"); cat != "" {
			b.WriteString(cat)
			b.WriteByte('\n')
		}
		chapters := normalizeChapters(entry["chapters"])
		if n := len(chapters); n > 0 {
			b.WriteString(fmt.Sprintf("%d chapter", n))
			if n != 1 {
				b.WriteByte('s')
			}
			b.WriteByte('\n')
			max := 6
			if max > n {
				max = n
			}
			for i := 0; i < max; i++ {
				b.WriteString("  · ")
				b.WriteString(chapters[i].Title)
				b.WriteByte('\n')
			}
			if n > max {
				b.WriteString(fmt.Sprintf("  … +%d more", n-max))
			}
		} else {
			b.WriteString("(no chapters)")
		}
		return strings.TrimRight(b.String(), "\n")
	case "monster", "npc":
		return FormatStatblock(entry, typ)
	case "spell":
		return FormatSpellDetail(entry)
	case "item":
		return FormatItemDetail(entry)
	default:
		return FormatGenericDetail(entry, typ)
	}
}

func anyString(v any) string {
	switch t := v.(type) {
	case nil:
		return ""
	case string:
		return strings.TrimSpace(t)
	case float64:
		return trimNum(t)
	case bool:
		return strconv.FormatBool(t)
	case int:
		return strconv.Itoa(t)
	case int64:
		return strconv.FormatInt(t, 10)
	default:
		return strings.TrimSpace(fmt.Sprintf("%v", t))
	}
}

func abilityMod(score int) int {
	diff := score - 10
	if diff < 0 && diff%2 != 0 {
		return diff/2 - 1
	}
	return diff / 2
}

func toFloat(v any) float64 {
	f, _ := toFloatOK(v)
	return f
}

func toFloatOK(v any) (float64, bool) {
	switch t := v.(type) {
	case float64:
		return t, true
	case int:
		return float64(t), true
	case int64:
		return float64(t), true
	case string:
		f, err := strconv.ParseFloat(strings.TrimSpace(t), 64)
		if err != nil {
			return 0, false
		}
		return f, true
	default:
		return 0, false
	}
}
