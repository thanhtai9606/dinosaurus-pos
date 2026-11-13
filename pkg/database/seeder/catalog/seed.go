package catalog

import (
	cloudflarer2 "dinosaurus-pos/pkg/cloudflare-r2"
	prdunits "dinosaurus-pos/internal/products"
	products_repo "dinosaurus-pos/internal/products/repository"
	"dinosaurus-pos/pkg/database"
	"dinosaurus-pos/pkg/logger"
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

// SeedDemoCatalog ensures categories and inserts demo products for the given market and vertical.
// Caller must set tenant context via tenant.WithID when seeding a specific tenant.
func SeedDemoCatalog(
	ctx context.Context,
	db *database.TenantDB,
	r2Client cloudflarer2.IR2,
	log logger.ILogger,
	market, vertical string,
) ([]SeededProduct, error) {
	if !Validate(market, vertical) {
		return nil, fmt.Errorf("unsupported market %q or vertical %q", market, vertical)
	}

	categoryMap, err := ensureCategories(ctx, db, CategoryNamesFor(market, vertical), log)
	if err != nil {
		return nil, err
	}

	defs := ProductsFor(market, vertical)
	if len(defs) == 0 {
		return nil, fmt.Errorf("no products for market %q vertical %q", market, vertical)
	}

	q := products_repo.New(db)
	var seeded []SeededProduct

	for _, d := range defs {
		imageURL := d.ImageURL
		var imagePtr *string
		if imageURL != "" {
			imagePtr = &imageURL
		}

		var productID string
		err := db.QueryRow(ctx,
			`INSERT INTO products (name, image_url, price, stock, cost_price, code, sku, barcode, unit)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			 RETURNING id`,
			d.Name, imagePtr, d.Price, d.Stock, d.CostPrice, d.Code, d.Sku, d.Barcode, d.Unit,
		).Scan(&productID)
		if err != nil {
			if isPgUniqueViolation(err) {
				productID, err = loadProductIDByCode(ctx, db, d.Code)
				if err != nil {
					log.Infof("Product %s (%s) already exists but cannot load: %v", d.Name, d.Code, err)
					continue
				}
			} else {
				log.Errorf("Failed to insert product %s: %v", d.Name, err)
				continue
			}
		}

		storedImageURL := uploadImageFromURL(ctx, r2Client, d.ImageURL, "products", productID, log)
		if storedImageURL != nil && d.ImageURL != "" && *storedImageURL != d.ImageURL {
			_, _ = db.Exec(ctx, "UPDATE products SET image_url = $1 WHERE id = $2", *storedImageURL, productID)
		}

		if catID, ok := categoryMap[d.Category]; ok {
			_, _ = db.Exec(ctx,
				`INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
				productID, catID,
			)
		} else {
			log.Warnf("Category %q not found for product %s", d.Category, d.Name)
		}

		prodUUID, err := uuid.Parse(productID)
		if err != nil {
			return nil, fmt.Errorf("invalid product id %s: %w", productID, err)
		}
		row, err := q.GetProductByID(ctx, prodUUID)
		if err != nil {
			return nil, fmt.Errorf("load product %s after insert: %w", d.Code, err)
		}
		if err := prdunits.EnsureBaseProductUnit(ctx, q, productFromGetRow(row)); err != nil {
			return nil, fmt.Errorf("ensure base unit for %s: %w", d.Code, err)
		}

		p := SeededProduct{
			ID:        productID,
			Name:      d.Name,
			Price:     d.Price,
			CostPrice: d.CostPrice,
		}

		for _, opt := range d.Options {
			var optImage *string
			if opt.ImageURL != "" {
				optImage = &opt.ImageURL
			}
			var optID string
			err := db.QueryRow(ctx,
				`INSERT INTO product_options (product_id, name, additional_price, image_url)
				 VALUES ($1, $2, $3, $4)
				 RETURNING id`,
				productID, opt.Name, opt.AdditionalPrice, optImage,
			).Scan(&optID)
			if err != nil {
				if !isPgUniqueViolation(err) {
					log.Infof("Option %q for %s failed: %v", opt.Name, d.Name, err)
				}
				continue
			}

			storedOptImageURL := uploadImageFromURL(ctx, r2Client, opt.ImageURL, "product_options", optID, log)
			if storedOptImageURL != nil && opt.ImageURL != "" && *storedOptImageURL != opt.ImageURL {
				_, _ = db.Exec(ctx, "UPDATE product_options SET image_url = $1 WHERE id = $2", *storedOptImageURL, optID)
			}

			p.Options = append(p.Options, SeededOption{
				ID:              optID,
				Name:            opt.Name,
				AdditionalPrice: opt.AdditionalPrice,
			})
		}

		seeded = append(seeded, p)
	}

	return seeded, nil
}

func ensureCategories(ctx context.Context, db *database.TenantDB, names []string, log logger.ILogger) (map[string]int32, error) {
	m := make(map[string]int32, len(names))
	for _, name := range names {
		var id int32
		err := db.QueryRow(ctx,
			`INSERT INTO categories (name) VALUES ($1)
			 ON CONFLICT (tenant_id, name) DO NOTHING
			 RETURNING id`,
			name,
		).Scan(&id)
		if err != nil {
			err = db.QueryRow(ctx, `SELECT id FROM categories WHERE name = $1 LIMIT 1`, name).Scan(&id)
			if err != nil {
				return nil, fmt.Errorf("category %q: %w", name, err)
			}
		}
		m[name] = id
	}
	return m, nil
}

func isPgUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func loadProductIDByCode(ctx context.Context, db *database.TenantDB, code string) (string, error) {
	var id string
	err := db.QueryRow(ctx,
		`SELECT id FROM products WHERE code = $1 AND deleted_at IS NULL LIMIT 1`,
		code,
	).Scan(&id)
	return id, err
}

func productFromGetRow(row products_repo.GetProductByIDRow) products_repo.Product {
	return products_repo.Product{
		ID:                row.ID,
		Name:              row.Name,
		ImageUrl:          row.ImageUrl,
		Price:             row.Price,
		Stock:             row.Stock,
		CreatedAt:         row.CreatedAt,
		UpdatedAt:         row.UpdatedAt,
		DeletedAt:         row.DeletedAt,
		CostPrice:         row.CostPrice,
		Sku:               row.Sku,
		Barcode:           row.Barcode,
		Unit:              row.Unit,
		MinStock:          row.MinStock,
		DefaultSupplierID: row.DefaultSupplierID,
		Code:              row.Code,
		TenantID:          row.TenantID,
	}
}
