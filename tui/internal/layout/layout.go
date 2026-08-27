// Package layout chooses wide vs narrow terminal pane geometry.
package layout

// Mode is the responsive layout mode.
type Mode int

const (
	ModeNarrow Mode = iota
	ModeWide
)

// WideMinWidth is the terminal width at which main + inspector sit side-by-side.
const WideMinWidth = 100

// Detect returns ModeWide when width >= WideMinWidth, otherwise ModeNarrow.
func Detect(width int) Mode {
	if width >= WideMinWidth {
		return ModeWide
	}
	return ModeNarrow
}

// PaneSizes returns main and inspector dimensions for the given terminal size.
// Wide: side-by-side (shared height). Narrow/portrait: stacked (shared width).
func PaneSizes(width, height int) (mainW, inspW, mainH, inspH int) {
	if width < 1 {
		width = 1
	}
	if height < 1 {
		height = 1
	}
	if Detect(width) == ModeWide {
		inspW = width * 35 / 100
		if inspW < 24 {
			inspW = 24
		}
		if inspW > width/2 {
			inspW = width / 2
		}
		mainW = width - inspW
		if mainW < 1 {
			mainW = 1
			inspW = width - 1
		}
		mainH, inspH = height, height
		return
	}
	mainW, inspW = width, width
	inspH = height * 30 / 100
	if inspH < 6 {
		inspH = 6
	}
	if inspH > height/2 {
		inspH = height / 2
	}
	mainH = height - inspH
	if mainH < 1 {
		mainH = 1
		inspH = height - 1
	}
	return
}

// SceneTripleMinWidth is the terminal width for nav | scene | party side-by-side.
const SceneTripleMinWidth = 110

// SceneColumns returns left (scene nav), middle (content), right (party) widths.
// Below SceneTripleMinWidth, left/right may be 0 — the UI should show the focused side only.
func SceneColumns(width int) (left, mid, right int) {
	if width < 1 {
		width = 1
	}
	if width < SceneTripleMinWidth {
		return 0, width, 0
	}
	left = width * 22 / 100
	if left < 20 {
		left = 20
	}
	right = width * 20 / 100
	if right < 18 {
		right = 18
	}
	mid = width - left - right
	if mid < 30 {
		need := 30 - mid
		takeL := need / 2
		takeR := need - takeL
		left -= takeL
		right -= takeR
		mid = width - left - right
	}
	if left < 12 {
		left = 12
	}
	if right < 12 {
		right = 12
	}
	mid = width - left - right
	if mid < 1 {
		mid = 1
	}
	return left, mid, right
}
