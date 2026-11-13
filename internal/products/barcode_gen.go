package products

import (
	"fmt"

	"github.com/google/uuid"
)

// generateProductUnitBarcode returns a unique internal EAN-13-style code (prefix 29 = in-store).
func generateProductUnitBarcode(productID uuid.UUID, sortOrder int32) string {
	n := productID[:]
	var sum uint64
	for i := 0; i < len(n); i++ {
		sum = sum*31 + uint64(n[i])
	}
	sum += uint64(sortOrder) * 997
	body := fmt.Sprintf("%011d", sum%1_000_000_000_000)
	base := "29" + body[:11]
	return base + ean13CheckDigit(base)
}

func ean13CheckDigit(twelve string) string {
	if len(twelve) != 12 {
		return "0"
	}
	sum := 0
	for i := 0; i < 12; i++ {
		d := int(twelve[i] - '0')
		if i%2 == 0 {
			sum += d
		} else {
			sum += d * 3
		}
	}
	check := (10 - (sum % 10)) % 10
	return fmt.Sprintf("%d", check)
}
