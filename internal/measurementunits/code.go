package measurementunits

import (
	"fmt"
	"strings"
	"unicode"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

// deriveUnitCode builds an internal short code from a display name (not shown in UI).
func deriveUnitCode(name string) string {
	s := strings.TrimSpace(name)
	if s == "" {
		return "U"
	}
	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	ascii, _, _ := transform.String(t, s)
	var b strings.Builder
	for _, r := range ascii {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(unicode.ToUpper(r))
		}
	}
	out := b.String()
	if out == "" {
		var h uint32
		for _, r := range s {
			h = h*31 + uint32(r)
		}
		out = fmt.Sprintf("U%X", h%0xFFFF)
	}
	if len(out) > 20 {
		out = out[:20]
	}
	return out
}
