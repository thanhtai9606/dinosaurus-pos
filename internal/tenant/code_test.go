package tenant

import "testing"

func TestNormalizeCode(t *testing.T) {
	tests := []struct {
		in    string
		want  string
		isErr bool
	}{
		{"default", "default", false},
		{"ACME-01", "acme-01", false},
		{"ab", "ab", false},
		{"a", "", true},
		{"has space", "", true},
		{"bad!", "", true},
	}
	for _, tc := range tests {
		got, err := NormalizeCode(tc.in)
		if tc.isErr {
			if err == nil {
				t.Fatalf("NormalizeCode(%q) expected error", tc.in)
			}
			continue
		}
		if err != nil || got != tc.want {
			t.Fatalf("NormalizeCode(%q) = %q, %v; want %q", tc.in, got, err, tc.want)
		}
	}
}
