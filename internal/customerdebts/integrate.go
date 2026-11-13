package customerdebts

import (
	"context"
	"errors"
	"fmt"
	"time"

	cd_repo "dinosaurus-pos/internal/customerdebts/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type FromOrderParams struct {
	CustomerID  uuid.UUID
	OrderID     uuid.UUID
	ReferenceNo string
	Total       float64
	CreatedBy   pgtype.UUID
}

func CreateDebtFromOrderTx(ctx context.Context, q *cd_repo.Queries, p FromOrderParams) error {
	if p.CustomerID == uuid.Nil || p.Total <= 0 {
		return nil
	}
	_, err := q.GetCustomerDebtByOrderID(ctx, p.OrderID)
	if err == nil {
		return nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}
	orderID := pgtype.UUID{Bytes: p.OrderID, Valid: true}
	_, err = q.CreateCustomerDebt(ctx, cd_repo.CreateCustomerDebtParams{
		CustomerID:  p.CustomerID,
		OrderID:     orderID,
		ReferenceNo: p.ReferenceNo,
		TotalAmount: cd_repo.FloatToNumeric(p.Total),
		AmountPaid:  cd_repo.FloatToNumeric(0),
		Status:      cd_repo.DebtStatusOpen,
		Note:        nil,
		IssuedAt:    cd_repo.PtrTime(time.Now()),
		CreatedBy:   p.CreatedBy,
	})
	return err
}

func VoidDebtByOrderTx(ctx context.Context, q *cd_repo.Queries, orderID uuid.UUID) error {
	debt, err := q.GetCustomerDebtByOrderID(ctx, orderID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return err
	}
	if debt.Status == cd_repo.DebtStatusSettled || debt.Status == cd_repo.DebtStatusVoid {
		return nil
	}
	_, err = q.SetCustomerDebtStatus(ctx, debt.ID, cd_repo.DebtStatusVoid)
	return err
}

func RecordOrderPaymentTx(ctx context.Context, q *cd_repo.Queries, orderID uuid.UUID, amount float64, createdBy pgtype.UUID) error {
	debt, err := q.GetCustomerDebtByOrderID(ctx, orderID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return err
	}
	if debt.Status == cd_repo.DebtStatusVoid || debt.Status == cd_repo.DebtStatusSettled {
		return nil
	}
	total := cd_repo.NumericToFloat(debt.TotalAmount)
	paid := cd_repo.NumericToFloat(debt.AmountPaid)
	newPaid := paid + amount
	if newPaid > total+0.0001 {
		newPaid = total
		amount = total - paid
	}
	_, err = q.InsertCustomerDebtPayment(ctx, cd_repo.InsertCustomerDebtPaymentParams{
		CustomerDebtID: debt.ID,
		Amount:         cd_repo.FloatToNumeric(amount),
		PaidAt:         cd_repo.PtrTime(time.Now()),
		Note:           nil,
		CreatedBy:      createdBy,
	})
	if err != nil {
		return err
	}
	status := cd_repo.DebtStatusFromAmounts(total, newPaid)
	_, err = q.UpdateCustomerDebtAmounts(ctx, cd_repo.UpdateCustomerDebtAmountsParams{
		ID:         debt.ID,
		AmountPaid: cd_repo.FloatToNumeric(newPaid),
		Status:     status,
	})
	return err
}

func ManualReferenceNo() string {
	return fmt.Sprintf("CD-MAN-%s", time.Now().Format("20060102150405"))
}
