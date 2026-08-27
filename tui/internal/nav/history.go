// Package nav provides a simple frame stack for TUI navigation history.
package nav

// Frame is one navigation location (screen name, list cursor, optional data).
type Frame struct {
	Name   string
	Cursor int
	Data   map[string]string
}

// Stack is a LIFO navigation history. Back (Pop) restores the previous frame.
type Stack struct {
	frames []Frame
}

func cloneData(in map[string]string) map[string]string {
	if in == nil {
		return nil
	}
	out := make(map[string]string, len(in))
	for k, v := range in {
		out[k] = v
	}
	return out
}

func cloneFrame(f Frame) Frame {
	return Frame{Name: f.Name, Cursor: f.Cursor, Data: cloneData(f.Data)}
}

// Push appends a frame (copies Data).
func (s *Stack) Push(f Frame) {
	s.frames = append(s.frames, cloneFrame(f))
}

// Pop removes and returns the top frame. The new Current is the previous frame.
func (s *Stack) Pop() (Frame, bool) {
	if len(s.frames) == 0 {
		return Frame{}, false
	}
	f := s.frames[len(s.frames)-1]
	s.frames = s.frames[:len(s.frames)-1]
	return f, true
}

// Replace swaps the top frame without changing stack depth. Empty stack pushes.
func (s *Stack) Replace(f Frame) {
	if len(s.frames) == 0 {
		s.Push(f)
		return
	}
	s.frames[len(s.frames)-1] = cloneFrame(f)
}

// Len returns the number of frames.
func (s *Stack) Len() int { return len(s.frames) }

// Current returns the top frame without removing it.
func (s *Stack) Current() (Frame, bool) {
	if len(s.frames) == 0 {
		return Frame{}, false
	}
	return cloneFrame(s.frames[len(s.frames)-1]), true
}
