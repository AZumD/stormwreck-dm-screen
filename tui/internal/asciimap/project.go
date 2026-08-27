package asciimap

import (
	"math"
	"strings"

	"github.com/AZumD/stormwreck-dm-screen/tui/internal/model"
)

// Marker is a placed glyph on the ASCII field.
type Marker struct {
	Col, Row int
	Glyph    rune
	Key      string
}

// Bounds describes the world/grid rectangle used for projection.
type Bounds struct {
	MinX, MinY float64
	MaxX, MaxY float64
	Width      int
	Height     int
}

// Project maps world (or percent) positions into a terminal cell grid.
// When gridSizeX/Y > 0 they define the coordinate field; otherwise extents from markers.
func Project(width, height int, gridSizeX, gridSizeY float64, entities []model.Entity, selectedKey string) (string, []Marker) {
	if width < 4 {
		width = 4
	}
	if height < 3 {
		height = 3
	}

	b := Bounds{Width: width, Height: height}
	if gridSizeX > 0 && gridSizeY > 0 {
		b.MinX, b.MinY = 0, 0
		b.MaxX, b.MaxY = gridSizeX, gridSizeY
	} else {
		b.MinX, b.MinY = 0, 0
		b.MaxX, b.MaxY = 10, 10
		for _, e := range entities {
			if !e.HasWorldPos || !e.OnActiveMap {
				continue
			}
			x, y := e.WorldX, e.WorldY
			if e.PercentPos {
				x = e.WorldX / 10 // treat % as 0–100 → rough 0–10 if no grid
				y = e.WorldY / 10
			}
			if x < b.MinX {
				b.MinX = x
			}
			if y < b.MinY {
				b.MinY = y
			}
			if x > b.MaxX {
				b.MaxX = x
			}
			if y > b.MaxY {
				b.MaxY = y
			}
		}
		if b.MaxX <= b.MinX {
			b.MaxX = b.MinX + 1
		}
		if b.MaxY <= b.MinY {
			b.MaxY = b.MinY + 1
		}
	}

	cells := make([][]rune, height)
	for r := 0; r < height; r++ {
		row := make([]rune, width)
		for c := 0; c < width; c++ {
			row[c] = '·'
		}
		cells[r] = row
	}

	var markers []Marker
	for _, e := range entities {
		if !e.HasWorldPos || !e.OnActiveMap {
			continue
		}
		wx, wy := e.WorldX, e.WorldY
		if e.PercentPos {
			// percent 0–100 → world using grid extents
			wx = (e.WorldX / 100.0) * (b.MaxX - b.MinX)
			wy = (e.WorldY / 100.0) * (b.MaxY - b.MinY)
		}
		col, row := WorldToCell(wx, wy, b)
		g := GlyphFor(e, e.Key == selectedKey)
		cells[row][col] = g
		markers = append(markers, Marker{Col: col, Row: row, Glyph: g, Key: e.Key})
	}

	var bld strings.Builder
	for r := 0; r < height; r++ {
		if r > 0 {
			bld.WriteByte('\n')
		}
		bld.WriteString(string(cells[r]))
	}
	return bld.String(), markers
}

// WorldToCell clamps a world coordinate into terminal cells.
// Y grows downward on the terminal (row 0 = top = low world Y for UVTT-style maps).
func WorldToCell(wx, wy float64, b Bounds) (col, row int) {
	dx := b.MaxX - b.MinX
	dy := b.MaxY - b.MinY
	if dx <= 0 {
		dx = 1
	}
	if dy <= 0 {
		dy = 1
	}
	fx := (wx - b.MinX) / dx
	fy := (wy - b.MinY) / dy
	col = int(math.Floor(fx * float64(b.Width)))
	row = int(math.Floor(fy * float64(b.Height)))
	col = Clamp(col, 0, b.Width-1)
	row = Clamp(row, 0, b.Height-1)
	return col, row
}

func Clamp(v, lo, hi int) int {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func GlyphFor(e model.Entity, selected bool) rune {
	if selected {
		return '@'
	}
	switch e.Kind {
	case "pc":
		r := []rune(strings.ToUpper(e.Name))
		if len(r) > 0 && r[0] >= 'A' && r[0] <= 'Z' {
			return r[0]
		}
		return 'P'
	case "npc":
		r := []rune(strings.ToLower(e.Name))
		if len(r) > 0 && r[0] >= 'a' && r[0] <= 'z' {
			return r[0]
		}
		return 'n'
	case "monster":
		r := []rune(strings.ToUpper(e.Name))
		if len(r) > 0 && r[0] >= 'A' && r[0] <= 'Z' {
			return r[0]
		}
		return 'M'
	default:
		return '?'
	}
}
