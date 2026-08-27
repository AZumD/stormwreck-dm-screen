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
