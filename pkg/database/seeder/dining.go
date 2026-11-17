package seeder

import (
	"context"
	"fmt"

	"dinosaurus-pos/pkg/database"
	"dinosaurus-pos/pkg/logger"
)

func seedDiningLayout(ctx context.Context, db *database.TenantDB, log logger.ILogger) error {
	var count int
	if err := db.QueryRow(ctx, `SELECT COUNT(*) FROM dining_tables`).Scan(&count); err != nil {
		return fmt.Errorf("count dining tables: %w", err)
	}
	if count > 0 {
		log.Info("Dining layout already present, skipping dining seed")
		return nil
	}

	type areaSpec struct {
		name      string
		sortOrder int
		tables    []struct {
			name     string
			capacity int
		}
	}
	specs := []areaSpec{
		{
			name: "Tầng trệt", sortOrder: 0,
			tables: []struct {
				name     string
				capacity int
			}{
				{"Bàn 1", 4}, {"Bàn 2", 4}, {"Bàn 3", 6}, {"Bàn 4", 2},
			},
		},
		{
			name: "Sân vườn", sortOrder: 10,
			tables: []struct {
				name     string
				capacity int
			}{
				{"V01", 6}, {"V02", 6}, {"V03", 8},
			},
		},
	}

	for _, area := range specs {
		var areaID string
		err := db.QueryRow(ctx,
			`INSERT INTO dining_areas (name, sort_order) VALUES ($1, $2) RETURNING id::text`,
			area.name, area.sortOrder,
		).Scan(&areaID)
		if err != nil {
			return fmt.Errorf("insert dining area %q: %w", area.name, err)
		}
		for _, tbl := range area.tables {
			_, err := db.Exec(ctx,
				`INSERT INTO dining_tables (area_id, name, capacity, status) VALUES ($1::uuid, $2, $3, 'available')`,
				areaID, tbl.name, tbl.capacity,
			)
			if err != nil {
				return fmt.Errorf("insert table %q: %w", tbl.name, err)
			}
		}
	}
	log.Info("Seeded demo dining areas and tables")
	return nil
}