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

// Scene layout breakpoints.
const (
	SceneTripleMinWidth = 110 // three bordered panes
	SceneDualMinWidth   = 80  // body + one side pane
	SceneGutter         = 1   // blank columns between panes
)

// SceneMode describes how many scene panes fit.
type SceneMode int

const (
	SceneModeNarrow SceneMode = iota // body only (sides via focus overlay)
	SceneModeDual                    // body + focused side
	SceneModeTriple                  // nav | body | party
)

// DetectSceneMode picks a scene layout for the terminal width.
func DetectSceneMode(width int) SceneMode {
	switch {
	case width >= SceneTripleMinWidth:
		return SceneModeTriple
	case width >= SceneDualMinWidth:
		return SceneModeDual
	default:
		return SceneModeNarrow
	}
}

// SceneColumns returns outer pane widths (including borders) that sum with gutters
// to at most `width`. For triple: left+gutter+mid+gutter+right == width.
// For dual/narrow callers use Mid-only or Mid+one side from SceneDualWidths.
func SceneColumns(width int) (left, mid, right int) {
	if width < 1 {
		width = 1
	}
	if width < SceneTripleMinWidth {
		return 0, width, 0
	}
	g := SceneGutter
	avail := width - 2*g
	if avail < 40 {
		avail = width
		g = 0
	}
	left = avail * 22 / 100
	right = avail * 22 / 100
	if left < 22 {
		left = 22
	}
	if right < 20 {
		right = 20
	}
	mid = avail - left - right
	if mid < 36 {
		need := 36 - mid
		takeL := need / 2
		takeR := need - takeL
		left -= takeL
		right -= takeR
		mid = avail - left - right
	}
	if left < 16 {
		left = 16
	}
	if right < 16 {
		right = 16
	}
	mid = avail - left - right
	if mid < 1 {
		mid = 1
	}
	return left, mid, right
}

// SceneDualWidths returns (side, body) outer widths for dual layout (one gutter).
func SceneDualWidths(width int, sideIsLeft bool) (side, body int) {
	if width < 1 {
		width = 1
	}
	g := SceneGutter
	avail := width - g
	if avail < 20 {
		return 0, width
	}
	side = avail * 32 / 100
	if side < 18 {
		side = 18
	}
	if side > avail/2 {
		side = avail / 2
	}
	body = avail - side
	if body < 20 {
		body = 20
		side = avail - body
	}
	_ = sideIsLeft
	return side, body
}
