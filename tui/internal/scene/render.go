// Package scene formats server scene blocks for terminal display.
package scene

import (
	"strings"
)

// Ref is an @-reference extracted by the server block parser.
type Ref struct {
	Type  string `json:"type"`
	ID    string `json:"id"`
	Label string `json:"label,omitempty"`
}

// Block matches the JSON shape from server/lib/scene-blocks.js.
type Block struct {
	Type   string  `json:"type"`
	Text   string  `json:"text,omitempty"`
	Title  string  `json:"title,omitempty"`
	Refs   []Ref   `json:"refs,omitempty"`
	Blocks []Block `json:"blocks,omitempty"`
}

// FlattenRefs returns unique refs from blocks (depth-first), preserving first occurrence.
func FlattenRefs(blocks []Block) []Ref {
	var out []Ref
	seen := map[string]struct{}{}
	var walk func([]Block)
	walk = func(bs []Block) {
		for _, b := range bs {
			for _, r := range b.Refs {
				key := r.Type + ":" + r.ID
				if _, ok := seen[key]; ok {
					continue
				}
				seen[key] = struct{}{}
				out = append(out, r)
			}
			if len(b.Blocks) > 0 {
				walk(b.Blocks)
			}
		}
	}
	walk(blocks)
	return out
}

// FormatBlocks renders blocks for the terminal with READ ALOUD / DM NOTE labels
// and collapse titles.
func FormatBlocks(blocks []Block) string {
	var b strings.Builder
	for i, block := range blocks {
		if i > 0 {
			b.WriteString("\n\n")
		}
		writeBlock(&b, block, 0)
	}
	return b.String()
}

func writeBlock(b *strings.Builder, block Block, depth int) {
	indent := strings.Repeat("  ", depth)
	switch block.Type {
	case "read-aloud":
		b.WriteString(indent)
		b.WriteString("── READ ALOUD ──\n")
		writeBody(b, block, depth)
	case "dm-note":
		b.WriteString(indent)
		b.WriteString("── DM NOTE ──\n")
		writeBody(b, block, depth)
	case "collapse":
		title := block.Title
		if title == "" {
			title = "Details"
		}
		b.WriteString(indent)
		b.WriteString("▼ ")
		b.WriteString(title)
		b.WriteByte('\n')
		if len(block.Blocks) > 0 {
			for i, child := range block.Blocks {
				if i > 0 {
					b.WriteString("\n\n")
				}
				writeBlock(b, child, depth+1)
			}
		} else if t := strings.TrimSpace(block.Text); t != "" {
			writeIndented(b, t, depth+1)
		}
	default: // text and unknown
		if t := strings.TrimSpace(block.Text); t != "" {
			writeIndented(b, t, depth)
		} else if len(block.Blocks) > 0 {
			for i, child := range block.Blocks {
				if i > 0 {
					b.WriteString("\n\n")
				}
				writeBlock(b, child, depth)
			}
		}
	}
}

func writeBody(b *strings.Builder, block Block, depth int) {
	if t := strings.TrimSpace(block.Text); t != "" {
		writeIndented(b, t, depth)
		return
	}
	for i, child := range block.Blocks {
		if i > 0 {
			b.WriteString("\n\n")
		}
		writeBlock(b, child, depth)
	}
}

func writeIndented(b *strings.Builder, text string, depth int) {
	indent := strings.Repeat("  ", depth)
	lines := strings.Split(text, "\n")
	for i, line := range lines {
		if i > 0 {
			b.WriteByte('\n')
		}
		b.WriteString(indent)
		b.WriteString(line)
	}
}
