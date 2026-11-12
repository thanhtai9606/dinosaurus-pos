package supplierdebts

import (
	"context"
	"errors"
	"fmt"
	"time"

	sd_repo "POS-kasir/internal/supplierdebts/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type FromStockReceiptParams struct {
	SupplierID uuid.UUID
	ReceiptID  uuid.UUID
	ReceiptNo  string
	Total      float64
	AmountPaid float64
	CreatedBy  pgtype.UUID
}

// CreateDebtFromStockReceiptTx creates supplier debt when receipt is completed with outstanding balance.
func CreateDebtFromStockReceiptTx(ctx context.Context, q *sd_repo.Queries, p FromStockReceiptParams) error {
	if p.Total <= p.AmountPaid+0.0001 {
		return nil
	}
	if p.SupplierID == uuid.Nil {
		return nil
	}
	_, err := q.GetSupplierDebtByStockReceiptID(ctx, p.ReceiptID)
	if err == nil {
		return nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}

	receiptID := pgtype.UUID{Bytes: p.ReceiptID, Valid: true}
	status := sd_repo.DebtStatusFromAmounts(p.Total, p.AmountPaid)

	_, err = q.CreateSupplierDebt(ctx, sd_repo.CreateSupplierDebtParams{
		SupplierID:     p.SupplierID,
		StockReceiptID: receiptID,
		ReferenceNo:    p.ReceiptNo,
		TotalAmount:    sd_repo.FloatToNumeric(p.Total),
		AmountPaid:     sd_repo.FloatToNumeric(p.AmountPaid),
		Status:         status,
		Note:           nil,
		IssuedAt:       sd_repo.PtrTime(time.Now()),
		CreatedBy:      p.CreatedBy,
	})
	return err
}

// CreateDebtForAnyBalance also creates a settled debt record when fully paid at receipt (optional audit). MVP: skip when fully paid.
func ManualReferenceNo() string {
	return fmt.Sprintf("SD-MAN-%s", time.Now().Format("20060102150405"))
}
