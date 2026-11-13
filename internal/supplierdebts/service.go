package supplierdebts

import (
	"context"
	"errors"
	"fmt"
	"time"

	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/internal/common/pagination"
	"dinosaurus-pos/internal/common/store"
	sd_repo "dinosaurus-pos/internal/supplierdebts/repository"
	"dinosaurus-pos/pkg/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type ISupplierDebtService interface {
	List(ctx context.Context, req ListSupplierDebtsRequest) (*PagedSupplierDebtsResponse, error)
	Get(ctx context.Context, id uuid.UUID) (*SupplierDebtResponse, error)
	Summary(ctx context.Context) (*SupplierDebtSummaryResponse, error)
	CreateManual(ctx context.Context, req CreateManualSupplierDebtRequest) (*SupplierDebtResponse, error)
	RecordPayment(ctx context.Context, id uuid.UUID, req RecordSupplierDebtPaymentRequest) (*SupplierDebtResponse, error)
	Void(ctx context.Context, id uuid.UUID) (*SupplierDebtResponse, error)
}

type SupplierDebtService struct {
	repo  *sd_repo.Queries
	store store.Store
	log   logger.ILogger
}

func NewSupplierDebtService(repo *sd_repo.Queries, st store.Store, log logger.ILogger) ISupplierDebtService {
	return &SupplierDebtService{repo: repo, store: st, log: log}
}

func (s *SupplierDebtService) List(ctx context.Context, req ListSupplierDebtsRequest) (*PagedSupplierDebtsResponse, error) {
	req.SetDefaults()
	params := sd_repo.ListSupplierDebtsParams{
		Limit:  int32(req.Limit),
		Offset: int32((req.Page - 1) * req.Limit),
	}
	countParams := sd_repo.CountSupplierDebtsParams{}
	if req.SupplierID != nil {
		params.SupplierID = pgtype.UUID{Bytes: *req.SupplierID, Valid: true}
		countParams.SupplierID = params.SupplierID
	}
	if req.Status != nil {
		params.Status = sd_repo.NullDebtStatus{DebtStatus: sd_repo.DebtStatus(*req.Status), Valid: true}
		countParams.Status = params.Status
	}
	rows, err := s.repo.ListSupplierDebts(ctx, params)
	if err != nil {
		return nil, err
	}
	total, err := s.repo.CountSupplierDebts(ctx, countParams)
	if err != nil {
		return nil, err
	}
	out := make([]SupplierDebtResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, mapListRow(r))
	}
	return &PagedSupplierDebtsResponse{
		Debts: out,
		Pagination: pagination.BuildPagination(req.Page, int(total), req.Limit),
	}, nil
}

func (s *SupplierDebtService) Get(ctx context.Context, id uuid.UUID) (*SupplierDebtResponse, error) {
	row, err := s.repo.GetSupplierDebtByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	payments, _ := s.repo.ListSupplierDebtPayments(ctx, id)
	resp := mapListRow(row)
	resp.Payments = mapPayments(payments)
	return &resp, nil
}

func (s *SupplierDebtService) Summary(ctx context.Context) (*SupplierDebtSummaryResponse, error) {
	rows, err := s.repo.ListSupplierDebtSummary(ctx)
	if err != nil {
		return nil, err
	}
	items := make([]SupplierDebtSummaryItem, 0, len(rows))
	for _, r := range rows {
		items = append(items, SupplierDebtSummaryItem{
			SupplierID:   r.SupplierID,
			SupplierName: r.SupplierName,
			BalanceDue:   sd_repo.NumericToFloat(r.BalanceDue),
			OpenCount:    int(r.OpenCount),
		})
	}
	return &SupplierDebtSummaryResponse{Items: items}, nil
}

func (s *SupplierDebtService) CreateManual(ctx context.Context, req CreateManualSupplierDebtRequest) (*SupplierDebtResponse, error) {
	issued := time.Now()
	if req.IssuedAt != nil {
		issued = *req.IssuedAt
	}
	var createdBy pgtype.UUID
	if actorID, ok := ctx.Value(common.UserIDKey).(uuid.UUID); ok {
		createdBy = pgtype.UUID{Bytes: actorID, Valid: true}
	}
	debt, err := s.repo.CreateSupplierDebt(ctx, sd_repo.CreateSupplierDebtParams{
		SupplierID:     req.SupplierID,
		StockReceiptID: pgtype.UUID{},
		ReferenceNo:    ManualReferenceNo(),
		TotalAmount:    sd_repo.FloatToNumeric(req.TotalAmount),
		AmountPaid:     sd_repo.FloatToNumeric(0),
		Status:         sd_repo.DebtStatusOpen,
		Note:           req.Note,
		IssuedAt:       sd_repo.PtrTime(issued),
		CreatedBy:      createdBy,
	})
	if err != nil {
		s.log.Errorf("CreateManual supplier debt failed", "error", err)
		return nil, err
	}
	return s.Get(ctx, debt.ID)
}

func (s *SupplierDebtService) RecordPayment(ctx context.Context, id uuid.UUID, req RecordSupplierDebtPaymentRequest) (*SupplierDebtResponse, error) {
	var result *SupplierDebtResponse
	err := s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		qtx := sd_repo.New(tx)
		debt, err := qtx.GetSupplierDebtByID(ctx, id)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.ErrNotFound
			}
			return err
		}
		if debt.Status == sd_repo.DebtStatusVoid || debt.Status == sd_repo.DebtStatusSettled {
			return common.ErrInvalidState
		}
		total := sd_repo.NumericToFloat(debt.TotalAmount)
		paid := sd_repo.NumericToFloat(debt.AmountPaid)
		if paid+req.Amount > total+0.0001 {
			return fmt.Errorf("%w: payment exceeds balance", common.ErrInvalidInput)
		}
		paidAt := time.Now()
		if req.PaidAt != nil {
			paidAt = *req.PaidAt
		}
		var createdBy pgtype.UUID
		if actorID, ok := ctx.Value(common.UserIDKey).(uuid.UUID); ok {
			createdBy = pgtype.UUID{Bytes: actorID, Valid: true}
		}
		_, err = qtx.InsertSupplierDebtPayment(ctx, sd_repo.InsertSupplierDebtPaymentParams{
			SupplierDebtID: id,
			Amount:         sd_repo.FloatToNumeric(req.Amount),
			PaidAt:         sd_repo.PtrTime(paidAt),
			Note:           req.Note,
			CreatedBy:      createdBy,
		})
		if err != nil {
			return err
		}
		newPaid := paid + req.Amount
		status := sd_repo.DebtStatusFromAmounts(total, newPaid)
		_, err = qtx.UpdateSupplierDebtAmounts(ctx, sd_repo.UpdateSupplierDebtAmountsParams{
			ID:         id,
			AmountPaid: sd_repo.FloatToNumeric(newPaid),
			Status:     status,
		})
		if err != nil {
			return err
		}
		row, err := qtx.GetSupplierDebtByID(ctx, id)
		if err != nil {
			return err
		}
		payments, _ := qtx.ListSupplierDebtPayments(ctx, id)
		mapped := mapListRow(row)
		mapped.Payments = mapPayments(payments)
		result = &mapped
		return nil
	})
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (s *SupplierDebtService) Void(ctx context.Context, id uuid.UUID) (*SupplierDebtResponse, error) {
	debt, err := s.repo.GetSupplierDebtByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	if debt.StockReceiptID.Valid {
		return nil, common.ErrInvalidState
	}
	if debt.Status == sd_repo.DebtStatusSettled {
		return nil, common.ErrInvalidState
	}
	_, err = s.repo.SetSupplierDebtStatus(ctx, id, sd_repo.DebtStatusVoid)
	if err != nil {
		return nil, err
	}
	return s.Get(ctx, id)
}

func mapListRow(r sd_repo.SupplierDebtListRow) SupplierDebtResponse {
	total := sd_repo.NumericToFloat(r.TotalAmount)
	paid := sd_repo.NumericToFloat(r.AmountPaid)
	var receiptID *uuid.UUID
	if r.StockReceiptID.Valid {
		id := uuid.UUID(r.StockReceiptID.Bytes)
		receiptID = &id
	}
	return SupplierDebtResponse{
		ID:             r.ID,
		SupplierID:     r.SupplierID,
		SupplierName:   r.SupplierName,
		StockReceiptID: receiptID,
		ReferenceNo:    r.ReferenceNo,
		TotalAmount:    total,
		AmountPaid:     paid,
		BalanceDue:     total - paid,
		Status:         string(r.Status),
		Note:           r.Note,
		IssuedAt:       r.IssuedAt.Time,
		CreatedAt:      r.CreatedAt.Time,
		UpdatedAt:      r.UpdatedAt.Time,
	}
}

func mapPayments(rows []sd_repo.SupplierDebtPayment) []SupplierDebtPaymentResponse {
	out := make([]SupplierDebtPaymentResponse, 0, len(rows))
	for _, p := range rows {
		out = append(out, SupplierDebtPaymentResponse{
			ID:        p.ID,
			Amount:    sd_repo.NumericToFloat(p.Amount),
			PaidAt:    p.PaidAt.Time,
			Note:      p.Note,
			CreatedAt: p.CreatedAt.Time,
		})
	}
	return out
}
