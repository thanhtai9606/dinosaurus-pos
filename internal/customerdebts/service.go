package customerdebts

import (
	"context"
	"errors"
	"fmt"
	"time"

	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/internal/common/pagination"
	"dinosaurus-pos/internal/common/store"
	sd_repo "dinosaurus-pos/internal/customerdebts/repository"
	"dinosaurus-pos/pkg/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type ICustomerDebtService interface {
	List(ctx context.Context, req ListCustomerDebtsRequest) (*PagedCustomerDebtsResponse, error)
	Get(ctx context.Context, id uuid.UUID) (*CustomerDebtResponse, error)
	Summary(ctx context.Context) (*CustomerDebtSummaryResponse, error)
	CreateManual(ctx context.Context, req CreateManualCustomerDebtRequest) (*CustomerDebtResponse, error)
	RecordPayment(ctx context.Context, id uuid.UUID, req RecordCustomerDebtPaymentRequest) (*CustomerDebtResponse, error)
	Void(ctx context.Context, id uuid.UUID) (*CustomerDebtResponse, error)
}

type CustomerDebtService struct {
	repo  *sd_repo.Queries
	store store.Store
	log   logger.ILogger
}

func NewCustomerDebtService(repo *sd_repo.Queries, st store.Store, log logger.ILogger) ICustomerDebtService {
	return &CustomerDebtService{repo: repo, store: st, log: log}
}

func (s *CustomerDebtService) List(ctx context.Context, req ListCustomerDebtsRequest) (*PagedCustomerDebtsResponse, error) {
	req.SetDefaults()
	params := sd_repo.ListCustomerDebtsParams{
		Limit:  int32(req.Limit),
		Offset: int32((req.Page - 1) * req.Limit),
	}
	countParams := sd_repo.CountCustomerDebtsParams{}
	if req.CustomerID != nil {
		params.CustomerID = pgtype.UUID{Bytes: *req.CustomerID, Valid: true}
		countParams.CustomerID = params.CustomerID
	}
	if req.Status != nil {
		params.Status = sd_repo.NullDebtStatus{DebtStatus: sd_repo.DebtStatus(*req.Status), Valid: true}
		countParams.Status = params.Status
	}
	rows, err := s.repo.ListCustomerDebts(ctx, params)
	if err != nil {
		return nil, err
	}
	total, err := s.repo.CountCustomerDebts(ctx, countParams)
	if err != nil {
		return nil, err
	}
	out := make([]CustomerDebtResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, mapListRow(r))
	}
	return &PagedCustomerDebtsResponse{
		Debts: out,
		Pagination: pagination.BuildPagination(req.Page, int(total), req.Limit),
	}, nil
}

func (s *CustomerDebtService) Get(ctx context.Context, id uuid.UUID) (*CustomerDebtResponse, error) {
	row, err := s.repo.GetCustomerDebtByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	payments, _ := s.repo.ListCustomerDebtPayments(ctx, id)
	resp := mapListRow(row)
	resp.Payments = mapPayments(payments)
	return &resp, nil
}

func (s *CustomerDebtService) Summary(ctx context.Context) (*CustomerDebtSummaryResponse, error) {
	rows, err := s.repo.ListCustomerDebtSummary(ctx)
	if err != nil {
		return nil, err
	}
	items := make([]CustomerDebtSummaryItem, 0, len(rows))
	for _, r := range rows {
		items = append(items, CustomerDebtSummaryItem{
			CustomerID:   r.CustomerID,
			CustomerName: r.CustomerName,
			BalanceDue:   sd_repo.NumericToFloat(r.BalanceDue),
			OpenCount:    int(r.OpenCount),
		})
	}
	return &CustomerDebtSummaryResponse{Items: items}, nil
}

func (s *CustomerDebtService) CreateManual(ctx context.Context, req CreateManualCustomerDebtRequest) (*CustomerDebtResponse, error) {
	issued := time.Now()
	if req.IssuedAt != nil {
		issued = *req.IssuedAt
	}
	var createdBy pgtype.UUID
	if actorID, ok := ctx.Value(common.UserIDKey).(uuid.UUID); ok {
		createdBy = pgtype.UUID{Bytes: actorID, Valid: true}
	}
	debt, err := s.repo.CreateCustomerDebt(ctx, sd_repo.CreateCustomerDebtParams{
		CustomerID:     req.CustomerID,
		OrderID: pgtype.UUID{},
		ReferenceNo:    ManualReferenceNo(),
		TotalAmount:    sd_repo.FloatToNumeric(req.TotalAmount),
		AmountPaid:     sd_repo.FloatToNumeric(0),
		Status:         sd_repo.DebtStatusOpen,
		Note:           req.Note,
		IssuedAt:       sd_repo.PtrTime(issued),
		CreatedBy:      createdBy,
	})
	if err != nil {
		s.log.Errorf("CreateManual customer debt failed", "error", err)
		return nil, err
	}
	return s.Get(ctx, debt.ID)
}

func (s *CustomerDebtService) RecordPayment(ctx context.Context, id uuid.UUID, req RecordCustomerDebtPaymentRequest) (*CustomerDebtResponse, error) {
	var result *CustomerDebtResponse
	err := s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		qtx := sd_repo.New(tx)
		debt, err := qtx.GetCustomerDebtByID(ctx, id)
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
		_, err = qtx.InsertCustomerDebtPayment(ctx, sd_repo.InsertCustomerDebtPaymentParams{
			CustomerDebtID: id,
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
		_, err = qtx.UpdateCustomerDebtAmounts(ctx, sd_repo.UpdateCustomerDebtAmountsParams{
			ID:         id,
			AmountPaid: sd_repo.FloatToNumeric(newPaid),
			Status:     status,
		})
		if err != nil {
			return err
		}
		row, err := qtx.GetCustomerDebtByID(ctx, id)
		if err != nil {
			return err
		}
		payments, _ := qtx.ListCustomerDebtPayments(ctx, id)
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

func (s *CustomerDebtService) Void(ctx context.Context, id uuid.UUID) (*CustomerDebtResponse, error) {
	debt, err := s.repo.GetCustomerDebtByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	if debt.OrderID.Valid {
		return nil, common.ErrInvalidState
	}
	if debt.Status == sd_repo.DebtStatusSettled {
		return nil, common.ErrInvalidState
	}
	_, err = s.repo.SetCustomerDebtStatus(ctx, id, sd_repo.DebtStatusVoid)
	if err != nil {
		return nil, err
	}
	return s.Get(ctx, id)
}

func mapListRow(r sd_repo.CustomerDebtListRow) CustomerDebtResponse {
	total := sd_repo.NumericToFloat(r.TotalAmount)
	paid := sd_repo.NumericToFloat(r.AmountPaid)
	var orderID *uuid.UUID
	if r.OrderID.Valid {
		id := uuid.UUID(r.OrderID.Bytes)
		orderID = &id
	}
	return CustomerDebtResponse{
		ID:           r.ID,
		CustomerID:   r.CustomerID,
		CustomerName: r.CustomerName,
		OrderID:      orderID,
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

func mapPayments(rows []sd_repo.CustomerDebtPayment) []CustomerDebtPaymentResponse {
	out := make([]CustomerDebtPaymentResponse, 0, len(rows))
	for _, p := range rows {
		out = append(out, CustomerDebtPaymentResponse{
			ID:        p.ID,
			Amount:    sd_repo.NumericToFloat(p.Amount),
			PaidAt:    p.PaidAt.Time,
			Note:      p.Note,
			CreatedAt: p.CreatedAt.Time,
		})
	}
	return out
}
