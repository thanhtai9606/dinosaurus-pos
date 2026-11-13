package tenants

import "github.com/google/uuid"

type Summary struct {
	ID       uuid.UUID `json:"id"`
	Code     string    `json:"code"`
	Name     string    `json:"name"`
	IsActive bool      `json:"is_active"`
}

func Summaries(rows []Row) []Summary {
	out := make([]Summary, 0, len(rows))
	for _, r := range rows {
		out = append(out, Summary{ID: r.ID, Code: r.Code, Name: r.Name, IsActive: r.IsActive})
	}
	return out
}
