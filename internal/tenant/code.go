package tenant

import (
	"errors"
	"regexp"
	"strings"
	"unicode"
)

var ErrInvalidTenantCode = errors.New("invalid tenant code")

// CodePattern: lowercase letters, digits, underscore, hyphen; 2–32 chars; no whitespace.
var CodePattern = regexp.MustCompile(`^[a-z0-9_-]{2,32}$`)

func NormalizeCode(raw string) (string, error) {
	if strings.IndexFunc(raw, unicode.IsSpace) >= 0 {
		return "", ErrInvalidTenantCode
	}
	code := strings.ToLower(strings.TrimSpace(raw))
	if !CodePattern.MatchString(code) {
		return "", ErrInvalidTenantCode
	}
	return code, nil
}
