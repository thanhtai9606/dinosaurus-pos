package seeder

// Production catalog seed: multi-vertical demo SKUs (F&B, cafe, retail, electronics, fashion).
// Use `make db-reset` (or empty DB + `make seed`) for a clean catalog; SeedProductionData skips when >100 orders exist.

import (
	cloudflarer2 "dinosaurus-pos/pkg/cloudflare-r2"
	"dinosaurus-pos/internal/docno"
	"dinosaurus-pos/pkg/database"
	"dinosaurus-pos/pkg/database/seeder/catalog"
	"dinosaurus-pos/pkg/database/seeder/catalog/vn"
	"dinosaurus-pos/pkg/logger"
	"context"
	"fmt"
	"math/rand"
	"time"
)

func SeedProductionData(ctx context.Context, db *database.TenantDB, r2Client cloudflarer2.IR2, log logger.ILogger) error {
	log.Info("Seeding production data...")

	// Check if production data already exists (idempotent)
	var orderCount int
	err := db.QueryRow(ctx, "SELECT COUNT(*) FROM orders").Scan(&orderCount)
	if err != nil {
		return fmt.Errorf("failed to check existing orders: %w", err)
	}
	if orderCount > 100 {
		log.Info("Production data already exists (found >100 orders), skipping.")
		return nil
	}

	// Get user IDs for assigning orders
	userIDs, err := getUserIDs(ctx, db)
	if err != nil {
		return fmt.Errorf("failed to get user IDs: %w", err)
	}
	if len(userIDs) == 0 {
		return fmt.Errorf("no users found, please seed users first")
	}

	// Get payment method IDs
	paymentMethodMap, err := getPaymentMethodMap(ctx, db)
	if err != nil {
		return fmt.Errorf("failed to get payment methods: %w", err)
	}

	// Get cancellation reasons
	cancelReasons, err := getCancellationReasons(ctx, db)
	if err != nil {
		return fmt.Errorf("failed to get cancellation reasons: %w", err)
	}

	// Get promotions
	promotions, err := getPromotions(ctx, db)
	if err != nil {
		return fmt.Errorf("failed to get promotions: %w", err)
	}

	// 1. Seed Products + Options + Category Assignments (vn / multi demo pack)
	products, err := catalog.SeedDemoCatalog(ctx, db, r2Client, log, vn.MarketCode, vn.VerticalMulti)
	if err != nil {
		return fmt.Errorf("failed to seed products: %w", err)
	}
	log.Infof("Seeded %d products with variants", len(products))

	// 2. Seed Customers
	customerIDs, err := seedCustomers(ctx, db, log)
	if err != nil {
		return fmt.Errorf("failed to seed customers: %w", err)
	}
	log.Infof("Seeded %d customers", len(customerIDs))

	// 3. Seed Promotions
	err = seedPromotions(ctx, db, log)
	if err != nil {
		return fmt.Errorf("failed to seed promotions: %w", err)
	}
	log.Info("Seeded promotions")

	// 4. Seed Orders (with backdated timestamps)
	totalOrders, err := seedOrders(ctx, db, products, userIDs, customerIDs, paymentMethodMap, cancelReasons, promotions, log)
	if err != nil {
		return fmt.Errorf("failed to seed orders: %w", err)
	}
	log.Infof("Seeded %d orders spanning 2-4 months", totalOrders)

	// 5. Seed Shifts
	if err := seedShifts(ctx, db, userIDs, log); err != nil {
		return fmt.Errorf("failed to seed shifts: %w", err)
	}
	log.Info("Seeded cashier shifts")

	log.Info("Production data seeding completed successfully!")
	return nil
}

type seededProduct = catalog.SeededProduct
type seededOption = catalog.SeededOption

// ─── Helper Functions ────────────────────────────────────────────

func getUserIDs(ctx context.Context, db *database.TenantDB) ([]string, error) {
	rows, err := db.Query(ctx, "SELECT id FROM users WHERE is_active = true")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func getCategoryMap(ctx context.Context, db *database.TenantDB) (map[string]int32, error) {
	rows, err := db.Query(ctx, "SELECT id, name FROM categories")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	m := make(map[string]int32)
	for rows.Next() {
		var id int32
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			return nil, err
		}
		m[name] = id
	}
	return m, rows.Err()
}

func getPaymentMethodMap(ctx context.Context, db *database.TenantDB) (map[string]int32, error) {
	rows, err := db.Query(ctx, "SELECT id, name FROM payment_methods WHERE is_active = true")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	m := make(map[string]int32)
	for rows.Next() {
		var id int32
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			return nil, err
		}
		m[name] = id
	}
	return m, rows.Err()
}

func getCancellationReasons(ctx context.Context, db *database.TenantDB) ([]int32, error) {
	rows, err := db.Query(ctx, "SELECT id FROM cancellation_reasons")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []int32
	for rows.Next() {
		var id int32
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func getPromotions(ctx context.Context, db *database.TenantDB) ([]string, error) {
	rows, err := db.Query(ctx, "SELECT id FROM promotions WHERE is_active = true")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

// ─── 1. Products (catalog in production_catalog_vn.go) ─────────────

// ─── 2. Customers ────────────────────────────────────────────────

func seedCustomers(ctx context.Context, db *database.TenantDB, log logger.ILogger) ([]string, error) {
	customers := []struct {
		Name    string
		Phone   string
		Email   string
		Address string
	}{
		{"Nguyễn Văn An", "0901234567", "van.an@example.com", "123 Nguyễn Huệ, Q.1, TP.HCM"},
		{"Trần Thị Bình", "0901234568", "thi.binh@example.com", "45 Lê Lợi, Q.1, TP.HCM"},
		{"Lê Minh Cường", "0901234569", "minh.cuong@example.com", "88 Hai Bà Trưng, Q.3, TP.HCM"},
		{"Phạm Thu Dung", "0901234570", "thu.dung@example.com", "12 Trần Hưng Đạo, Q.5, TP.HCM"},
		{"Hoàng Văn Em", "0901234571", "van.em@example.com", "56 Cách Mạng Tháng 8, Q.10, TP.HCM"},
		{"Võ Thị Phương", "0901234572", "thi.phuong@example.com", "9 Phan Đình Phùng, Huế"},
		{"Đặng Quốc Huy", "0901234573", "quoc.huy@example.com", "30 Lý Thường Kiệt, Đà Nẵng"},
		{"Bùi Ngọc Lan", "0901234574", "ngoc.lan@example.com", "7 Bà Triệu, Hà Nội"},
		{"Đỗ Xuân Nam", "0901234575", "xuan.nam@example.com", "22 Nguyễn Trãi, Thanh Xuân, Hà Nội"},
		{"Mai Thảo Linh", "0901234576", "thao.linh@example.com", "5 Quang Trung, Cần Thơ"},
	}

	var ids []string
	for i, c := range customers {
		code := docno.CustomerCode(int64(i + 1))
		var id string
		err := db.QueryRow(ctx,
			`INSERT INTO customers (name, phone, email, address, code)
			 VALUES ($1, $2, $3, $4, $5)
			 RETURNING id`,
			c.Name, c.Phone, c.Email, c.Address, code,
		).Scan(&id)
		if err != nil {
			err = db.QueryRow(ctx,
				`SELECT id FROM customers WHERE code = $1 AND deleted_at IS NULL LIMIT 1`,
				code,
			).Scan(&id)
			if err != nil {
				log.Infof("Customer %s (%s) skipped: %v", c.Name, code, err)
				continue
			}
		}
		ids = append(ids, id)
	}
	return ids, nil
}

// ─── 3. Promotions ───────────────────────────────────────────────

func seedPromotions(ctx context.Context, db *database.TenantDB, log logger.ILogger) error {
	now := time.Now()
	threeMonthsAgo := now.AddDate(0, -3, 0)
	oneMonthLater := now.AddDate(0, 1, 0)

	promos := []struct {
		Name          string
		Description   string
		Scope         string
		DiscountType  string
		DiscountValue float64
		MaxDiscount   float64
		StartDate     time.Time
		EndDate       time.Time
		RuleType      string
		RuleValue     string
	}{
		{
			Name: "Diskon Grand Opening", Description: "Diskon 10% untuk semua pesanan di atas Rp50.000",
			Scope: "ORDER", DiscountType: "percentage", DiscountValue: 10, MaxDiscount: 15000,
			StartDate: threeMonthsAgo, EndDate: oneMonthLater,
			RuleType: "MINIMUM_ORDER_AMOUNT", RuleValue: "50000",
		},
		{
			Name: "Promo Paket Hemat", Description: "Potongan Rp5.000 untuk pesanan minimal Rp30.000",
			Scope: "ORDER", DiscountType: "fixed_amount", DiscountValue: 5000, MaxDiscount: 5000,
			StartDate: threeMonthsAgo, EndDate: oneMonthLater,
			RuleType: "MINIMUM_ORDER_AMOUNT", RuleValue: "30000",
		},
		{
			Name: "Happy Hour 15%", Description: "Diskon 15% untuk semua pesanan, maks Rp20.000",
			Scope: "ORDER", DiscountType: "percentage", DiscountValue: 15, MaxDiscount: 20000,
			StartDate: threeMonthsAgo, EndDate: oneMonthLater,
			RuleType: "MINIMUM_ORDER_AMOUNT", RuleValue: "25000",
		},
	}

	for _, p := range promos {
		var promoID string
		err := db.QueryRow(ctx,
			`INSERT INTO promotions (name, description, scope, discount_type, discount_value, max_discount_amount, start_date, end_date, is_active)
			 VALUES ($1, $2, $3::promotion_scope, $4::discount_type, $5, $6, $7, $8, true)
			 ON CONFLICT DO NOTHING
			 RETURNING id`,
			p.Name, p.Description, p.Scope, p.DiscountType, p.DiscountValue, p.MaxDiscount, p.StartDate, p.EndDate,
		).Scan(&promoID)
		if err != nil {
			log.Infof("Promotion '%s' may already exist: %v", p.Name, err)
			continue
		}

		// Add rule
		_, err = db.Exec(ctx,
			`INSERT INTO promotion_rules (promotion_id, rule_type, rule_value)
			 VALUES ($1, $2::promotion_rule_type, $3)`,
			promoID, p.RuleType, p.RuleValue,
		)
		if err != nil {
			log.Errorf("Failed to add rule for promotion '%s': %v", p.Name, err)
		}
	}

	return nil
}

// ─── 4. Orders ───────────────────────────────────────────────────

func seedOrders(ctx context.Context, db *database.TenantDB, products []seededProduct, userIDs []string, customerIDs []string, paymentMethodMap map[string]int32, cancelReasons []int32, promotions []string, log logger.ILogger) (int, error) {
	if len(products) == 0 {
		return 0, fmt.Errorf("no products to create orders from")
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	now := time.Now()

	// Go back 2-4 months (60-120 days)
	startDaysBack := 60 + rng.Intn(61) // 60-120
	startDate := now.AddDate(0, 0, -startDaysBack)

	orderTypes := []string{"dine_in", "takeaway"}
	paymentMethods := []string{"Cash", "QRIS Dinamis", "QRIS Statis"}
	paymentWeights := []int{70, 20, 10} // Weighted distribution

	totalOrders := 0

	// Iterate each day from startDate to now
	for d := startDate; d.Before(now); d = d.AddDate(0, 0, 1) {
		weekday := d.Weekday()

		// More orders on weekends
		var ordersToday int
		if weekday == time.Saturday || weekday == time.Sunday {
			ordersToday = 5 + rng.Intn(8) // 5-12
		} else {
			ordersToday = 3 + rng.Intn(5) // 3-7
		}

		for i := 0; i < ordersToday; i++ {
			// Random time between 08:00 and 21:00
			hour := 8 + rng.Intn(13)
			minute := rng.Intn(60)
			orderTime := time.Date(d.Year(), d.Month(), d.Day(), hour, minute, rng.Intn(60), 0, d.Location())

			// Random user
			userID := userIDs[rng.Intn(len(userIDs))]

			// Random order type (60% dine_in, 40% takeaway)
			orderType := orderTypes[0]
			if rng.Intn(100) < 40 {
				orderType = orderTypes[1]
			}

			// Random customer (30% chance)
			var customerID *string
			if len(customerIDs) > 0 && rng.Intn(100) < 30 {
				cid := customerIDs[rng.Intn(len(customerIDs))]
				customerID = &cid
			}

			// Pick payment method (weighted)
			pmName := pickWeighted(rng, paymentMethods, paymentWeights)
			pmID, ok := paymentMethodMap[pmName]
			if !ok {
				// fallback to Cash
				for name, id := range paymentMethodMap {
					pmID = id
					pmName = name
					break
				}
			}

			// 1-4 random items
			numItems := 1 + rng.Intn(4)
			usedProducts := make(map[int]bool)
			var grossTotal int64

			type orderItemData struct {
				productID string
				qty       int32
				price     int64
				subtotal  int64
				costPrice int64
			}
			var items []orderItemData

			for j := 0; j < numItems; j++ {
				// Pick a random product (avoid duplicates)
				idx := rng.Intn(len(products))
				if usedProducts[idx] {
					continue
				}
				usedProducts[idx] = true

				product := products[idx]
				qty := int32(1 + rng.Intn(3)) // 1-3

				// Sometimes include an option price
				itemPrice := product.Price
				if len(product.Options) > 0 && rng.Intn(100) < 40 {
					opt := product.Options[rng.Intn(len(product.Options))]
					itemPrice += opt.AdditionalPrice
				}

				subtotal := itemPrice * int64(qty)
				grossTotal += subtotal

				items = append(items, orderItemData{
					productID: product.ID,
					qty:       qty,
					price:     itemPrice,
					subtotal:  subtotal,
					costPrice: product.CostPrice,
				})
			}

			if len(items) == 0 {
				continue
			}

			// ~10% cancelled
			isCancelled := rng.Intn(100) < 10
			status := "paid"
			var cancelReasonID *int32
			var cancelNote *string

			if isCancelled {
				status = "cancelled"
				if len(cancelReasons) > 0 {
					id := cancelReasons[rng.Intn(len(cancelReasons))]
					cancelReasonID = &id
					note := "Dibatalkan secara acak dari seeder"
					cancelNote = &note
				}
			}

			// Apply promotion? (~20% chance, only if not cancelled)
			var appliedPromotionID *string
			var discountAmount int64 = 0
			if !isCancelled && len(promotions) > 0 && rng.Intn(100) < 20 {
				id := promotions[rng.Intn(len(promotions))]
				appliedPromotionID = &id
				// Random discount: either flat 5000 or 10%
				if rng.Intn(2) == 0 {
					discountAmount = 5000
				} else {
					discountAmount = grossTotal * 10 / 100
				}
				if discountAmount > grossTotal {
					discountAmount = grossTotal
				}
			}

			netTotal := grossTotal - discountAmount

			// Cash payment: calculate change
			var cashReceived *int64
			var changeDue *int64
			if pmName == "Cash" && !isCancelled {
				// Round up to nearest 5000 or 10000
				rounded := ((netTotal / 5000) + 1) * 5000
				if rounded < netTotal+1000 {
					rounded += 5000
				}
				cashReceived = &rounded
				change := rounded - netTotal
				changeDue = &change
			}

			// Insert order with backdated timestamp
			seq := totalOrders + 1
			orderNo := fmt.Sprintf("SO-%s-%04d", orderTime.UTC().Format("20060102"), seq)
			var orderID string
			err := db.QueryRow(ctx,
				`INSERT INTO orders (user_id, type, status, gross_total, discount_amount, net_total,
					payment_method_id, cash_received, change_due, customer_id, 
					cancellation_reason_id, cancellation_notes, applied_promotion_id, 
					order_no, created_at, updated_at, version)
				 VALUES ($1, $2::order_type, $3::order_status, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15, 1)
				 RETURNING id`,
				userID, orderType, status, grossTotal, discountAmount, netTotal, pmID,
				cashReceived, changeDue, customerID, cancelReasonID, cancelNote, appliedPromotionID, orderNo, orderTime,
			).Scan(&orderID)
			if err != nil {
				log.Errorf("Failed to create order: %v", err)
				continue
			}

			// Insert order items
			for _, item := range items {
				_, err := db.Exec(ctx,
					`INSERT INTO order_items (order_id, product_id, quantity, price_at_sale, subtotal, net_subtotal, cost_price_at_sale)
					 VALUES ($1, $2, $3, $4, $5, $5, $6)`,
					orderID, item.productID, item.qty, item.price, item.subtotal, item.costPrice,
				)
				if err != nil {
					log.Errorf("Failed to create order item: %v", err)
				}
			}

			totalOrders++
		}
	}

	return totalOrders, nil
}

func pickWeighted(rng *rand.Rand, items []string, weights []int) string {
	total := 0
	for _, w := range weights {
		total += w
	}
	r := rng.Intn(total)
	cumulative := 0
	for i, w := range weights {
		cumulative += w
		if r < cumulative {
			return items[i]
		}
	}
	return items[len(items)-1]
}

// ─── 5. Shifts ───────────────────────────────────────────────────

func seedShifts(ctx context.Context, db *database.TenantDB, userIDs []string, log logger.ILogger) error {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	now := time.Now()
	startDate := now.AddDate(0, 0, -120) // go back 120 days

	for d := startDate; d.Before(now); d = d.AddDate(0, 0, 1) {
		// Create 1 or 2 shifts per day
		numShifts := 1
		if rng.Intn(100) < 50 {
			numShifts = 2
		}

		for i := 0; i < numShifts; i++ {
			userID := userIDs[rng.Intn(len(userIDs))]
			
			// Shift start time between 07:00 and 14:00
			startHour := 7 + rng.Intn(8)
			startTime := time.Date(d.Year(), d.Month(), d.Day(), startHour, rng.Intn(60), 0, 0, d.Location())
			
			// Shift end time 6-10 hours later
			durationHours := 6 + rng.Intn(5)
			endTime := startTime.Add(time.Duration(durationHours) * time.Hour)
			if endTime.After(now) {
				continue
			}

			startCash := int64(rng.Intn(5)+5) * 100000 // 500k to 1m
			
			// Simulate sales cash (just random for seed purposes, 1m to 5m)
			salesCash := int64(rng.Intn(40)+10) * 100000
			expectedCash := startCash + salesCash
			
			// Actual cash is mostly accurate, sometimes slightly off (+/- 20k)
			actualCash := expectedCash
			if rng.Intn(100) < 20 {
				diff := int64(rng.Intn(40)-20) * 1000 // -20k to +20k
				actualCash += diff
			}

			_, err := db.Exec(ctx,
				`INSERT INTO shifts (user_id, start_time, end_time, start_cash, expected_cash_end, actual_cash_end, status, created_at, updated_at)
				 VALUES ($1, $2, $3, $4, $5, $6, 'closed', $2, $3)`,
				userID, startTime, endTime, startCash, expectedCash, actualCash,
			)
			if err != nil {
				log.Errorf("Failed to seed shift: %v", err)
			}
		}
	}
	return nil
}
