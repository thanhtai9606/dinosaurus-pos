package seeder

import (
	categories_repo "dinosaurus-pos/internal/categories/repository"
	"dinosaurus-pos/pkg/logger"
	"context"
)

func SeedCategory(ctx context.Context, q categories_repo.Querier, log logger.ILogger) error {
	kategori := []string{
		"Đồ uống & Cà phê",
		"Món ăn",
		"Bán lẻ tiêu dùng",
		"Điện tử",
		"Thời trang",
		"Combo",
	}

	for _, nama := range kategori {
		_, err := q.CreateCategory(ctx, nama)
		if err != nil {
			log.Errorf("gagal menambahkan kategori %s: %v", nama, err)
			continue
		}
	}
	log.Info("seeding kategori selesai")
	return nil
}
