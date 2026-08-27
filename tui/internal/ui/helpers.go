package ui

import (
	"fmt"
	"strconv"
	"strings"
)

func trimNum(f float64) string {
	if f == float64(int64(f)) {
		return strconv.FormatInt(int64(f), 10)
	}
	return strconv.FormatFloat(f, 'f', 1, 64)
}

// truncate keeps visible-cell-aware truncation for list labels.
func truncate(s string, n int) string {
	return TruncateVisible(s, n)
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

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func maxf(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

func minf(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

func clampIndex(i, n int) int {
	if n <= 0 {
		return 0
	}
	if i < 0 {
		return 0
	}
	if i >= n {
		return n - 1
	}
	return i
}

func strField(m map[string]any, keys ...string) string {
	for _, k := range keys {
		if v, ok := m[k]; ok && v != nil {
			switch t := v.(type) {
			case string:
				if strings.TrimSpace(t) != "" {
					return t
				}
			case float64:
				return trimNum(t)
			case bool:
				return fmt.Sprintf("%v", t)
			}
		}
	}
	return ""
}
