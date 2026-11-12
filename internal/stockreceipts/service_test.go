package stockreceipts

import (
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
)

func TestNumericToFloat(t *testing.T) {
	var n pgtype.Numeric
	if err := n.Scan("12.50"); err != nil {
		t.Fatal(err)
	}
	got := numericToFloat(n)
	if got != 12.5 {
		t.Fatalf("expected 12.5, got %v", got)
	}
	if numericToFloat(pgtype.Numeric{}) != 0 {
		t.Fatal("invalid numeric should be 0")
	}
}
