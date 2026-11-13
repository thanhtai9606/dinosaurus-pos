package settings

import (
	"fmt"
	"strings"
)

// FormatAmount formats a whole minor-unit amount for receipts (same units as stored in orders).
func FormatAmount(fin *FinancialSettingsResponse, amount int64) string {
	if fin == nil {
		return fmt.Sprintf("%d", amount)
	}
	code := strings.ToUpper(strings.TrimSpace(fin.Currency))
	opt := findCurrency(fin.AvailableCurrencies, code)
	sym := code
	if opt != nil && opt.Label != "" {
		if i := strings.Index(opt.Label, "("); i >= 0 {
			if j := strings.Index(opt.Label[i:], ")"); j > 1 {
				sym = strings.TrimSpace(opt.Label[i+1 : i+j])
			}
		}
	}
	switch code {
	case "VND", "IDR":
		return fmt.Sprintf("%s %s", sym, formatGrouped(amount))
	default:
		fd := 2
		if opt != nil {
			fd = opt.FractionDigits
		}
		if fd == 0 {
			return fmt.Sprintf("%s %s", sym, formatGrouped(amount))
		}
		div := int64(1)
		for i := 0; i < fd; i++ {
			div *= 10
		}
		whole := amount / div
		frac := amount % div
		if frac == 0 {
			return fmt.Sprintf("%s %s", sym, formatGrouped(whole))
		}
		return fmt.Sprintf("%s %s.%0*d", sym, formatGrouped(whole), fd, frac)
	}
}

func formatGrouped(n int64) string {
	s := fmt.Sprintf("%d", n)
	if n < 0 {
		s = s[1:]
	}
	var b strings.Builder
	for i, c := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteByte('.')
		}
		b.WriteRune(c)
	}
	if n < 0 {
		return "-" + b.String()
	}
	return b.String()
}
