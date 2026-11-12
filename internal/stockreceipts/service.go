package stockreceipts

import (
	"context"
	"errors"
	"fmt"
	"time"

	"POS-kasir/internal/common"
	"POS-kasir/internal/common/pagination"
	"POS-kasir/internal/common/store"
	products_repo "POS-kasir/internal/products/repository"
	sr_repo "POS-kasir/internal/stockreceipts/repository"
	"POS-kasir/pkg/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type IStockReceiptService interface {
	Create(ctx context.Context, req CreateStockReceiptRequest) (*StockReceiptResponse, error)
	Get(ctx context.Context, id uuid.UUID) (*StockReceiptResponse, error)
	List(ctx context.Context, req ListStockReceiptsRequest) (*PagedStockReceiptResponse, error)
	UpdateDraft(ctx context.Context, id uuid.UUID, req UpdateStockReceiptRequest) (*StockReceiptResponse, error)
	Complete(ctx context.Context, id uuid.UUID) (*StockReceiptResponse, error)
	Cancel(ctx context.Context, id uuid.UUID) (*StockReceiptResponse, error)
}

type StockReceiptService struct {
	repo  sr_repo.Querier
	store store.Store
	log   logger.ILogger
}

func NewStockReceiptService(repo sr_repo.Querier, st store.Store, log logger.ILogger) IStockReceiptService {
	return &StockReceiptService{repo: repo, store: st, log: log}
}

func (s *StockReceiptService) Create(ctx context.Context, req CreateStockReceiptRequest) (*StockReceiptResponse, error) {
	var receipt sr_repo.StockReceipt

	err := s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		qtx := sr_repo.New(tx)
		receiptNo, err := nextReceiptNo(ctx, qtx)
		if err != nil {
			return err
		}

		receivedAt := time.Now()
		if req.ReceivedAt != nil {
			receivedAt = *req.ReceivedAt
		}

		var createdBy pgtype.UUID
		if actorID, ok := ctx.Value(common.UserIDKey).(uuid.UUID); ok {
			createdBy = pgtype.UUID{Bytes: actorID, Valid: true}
		}

		supplierID := pgtype.UUID{}
		if req.SupplierID != nil {
			supplierID = pgtype.UUID{Bytes: *req.SupplierID, Valid: true}
		}

		receipt, err = qtx.CreateStockReceipt(ctx, sr_repo.CreateStockReceiptParams{
			ReceiptNo:  receiptNo,
			SupplierID: supplierID,
			ReceivedAt: pgtype.Timestamptz{Time: receivedAt, Valid: true},
			Note:       req.Note,
			CreatedBy:  createdBy,
		})
		if err != nil {
			return err
		}

		return insertReceiptItems(ctx, qtx, receipt.ID, req.Items)
	})
	if err != nil {
		s.log.Errorf("CreateStockReceipt failed", "error", err)
		return nil, err
	}

	return s.Get(ctx, receipt.ID)
}

func (s *StockReceiptService) Get(ctx context.Context, id uuid.UUID) (*StockReceiptResponse, error) {
	receipt, err := s.repo.GetStockReceiptByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}

	items, err := s.repo.ListStockReceiptItems(ctx, id)
	if err != nil {
		return nil, err
	}

	total, err := s.repo.SumReceiptLineTotal(ctx, id)
	if err != nil {
		return nil, err
	}

	return mapReceiptDetail(receipt, items, total), nil
}

func (s *StockReceiptService) List(ctx context.Context, req ListStockReceiptsRequest) (*PagedStockReceiptResponse, error) {
	req.SetDefaults()
	limit := req.Limit
	offset := (req.Page - 1) * limit

	params := sr_repo.ListStockReceiptsParams{
		Limit:  int32(limit),
		Offset: int32(offset),
	}
	countParams := sr_repo.CountStockReceiptsParams{}

	if req.Status != nil {
		st := sr_repo.StockReceiptStatus(*req.Status)
		params.Status = &st
		countParams.Status = &st
	}
	if req.SupplierID != nil {
		sid := pgtype.UUID{Bytes: *req.SupplierID, Valid: true}
		params.SupplierID = sid
		countParams.SupplierID = sid
	}
	if req.FromDate != nil {
		params.FromDate = pgtype.Timestamptz{Time: *req.FromDate, Valid: true}
		countParams.FromDate = params.FromDate
	}
	if req.ToDate != nil {
		params.ToDate = pgtype.Timestamptz{Time: *req.ToDate, Valid: true}
		countParams.ToDate = params.ToDate
	}

	rows, err := s.repo.ListStockReceipts(ctx, params)
	if err != nil {
		return nil, err
	}

	count, err := s.repo.CountStockReceipts(ctx, countParams)
	if err != nil {
		return nil, err
	}

	var list []StockReceiptListItem
	for _, row := range rows {
		total, _ := s.repo.SumReceiptLineTotal(ctx, row.ID)
		list = append(list, mapReceiptListRow(row, total))
	}

	return &PagedStockReceiptResponse{
		Receipts:   list,
		Pagination: pagination.BuildPagination(req.Page, int(count), limit),
	}, nil
}

func (s *StockReceiptService) UpdateDraft(ctx context.Context, id uuid.UUID, req UpdateStockReceiptRequest) (*StockReceiptResponse, error) {
	receipt, err := s.repo.GetStockReceiptByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	if receipt.Status != sr_repo.StockReceiptStatusDraft {
		return nil, common.ErrInvalidState
	}

	receivedAt := receipt.ReceivedAt.Time
	if req.ReceivedAt != nil {
		receivedAt = *req.ReceivedAt
	}

	supplierID := receipt.SupplierID
	if req.SupplierID != nil {
		supplierID = pgtype.UUID{Bytes: *req.SupplierID, Valid: true}
	} else if req.SupplierID == nil && req.Items != nil {
		// keep existing supplier when only updating items
	}

	note := receipt.Note
	if req.Note != nil {
		note = req.Note
	}

	err = s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		qtx := sr_repo.New(tx)
		_, err := qtx.UpdateStockReceiptDraft(ctx, sr_repo.UpdateStockReceiptDraftParams{
			ID:         id,
			SupplierID: supplierID,
			ReceivedAt: pgtype.Timestamptz{Time: receivedAt, Valid: true},
			Note:       note,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.ErrInvalidState
			}
			return err
		}
		if err := qtx.DeleteStockReceiptItems(ctx, id); err != nil {
			return err
		}
		return insertReceiptItems(ctx, qtx, id, req.Items)
	})
	if err != nil {
		return nil, err
	}

	return s.Get(ctx, id)
}

func (s *StockReceiptService) Complete(ctx context.Context, id uuid.UUID) (*StockReceiptResponse, error) {
	receipt, err := s.repo.GetStockReceiptByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	if receipt.Status != sr_repo.StockReceiptStatusDraft {
		return nil, common.ErrInvalidState
	}

	items, err := s.repo.ListStockReceiptItems(ctx, id)
	if err != nil {
		return nil, err
	}
	if len(items) == 0 {
		return nil, common.ErrInvalidInput
	}

	err = s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		qtx := sr_repo.New(tx)
		prd := products_repo.New(tx)

		var createdBy pgtype.UUID
		if actorID, ok := ctx.Value(common.UserIDKey).(uuid.UUID); ok {
			createdBy = pgtype.UUID{Bytes: actorID, Valid: true}
		}

		refID := pgtype.UUID{Bytes: id, Valid: true}
		note := fmt.Sprintf("Stock receipt %s", receipt.ReceiptNo)

		for _, line := range items {
			prod, err := prd.GetProductByID(ctx, line.ProductID)
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					return fmt.Errorf("%w: product not found", common.ErrInvalidInput)
				}
				return err
			}

			previousStock := prod.Stock
			updated, err := prd.AddProductStock(ctx, products_repo.AddProductStockParams{
				ID:       line.ProductID,
				Quantity: line.Quantity,
			})
			if err != nil {
				return err
			}

			cost := line.UnitCost
			if _, err := prd.SetProductCostPrice(ctx, products_repo.SetProductCostPriceParams{
				ID:        line.ProductID,
				CostPrice: cost,
			}); err != nil {
				return err
			}

			_, err = prd.CreateStockHistory(ctx, products_repo.CreateStockHistoryParams{
				ProductID:     line.ProductID,
				ChangeAmount:  line.Quantity,
				PreviousStock: previousStock,
				CurrentStock:  updated.Stock,
				ChangeType:    products_repo.StockChangeTypeRestock,
				ReferenceID:   refID,
				Note:          &note,
				CreatedBy:     createdBy,
			})
			if err != nil {
				return err
			}
		}

		_, err = qtx.SetStockReceiptStatus(ctx, sr_repo.SetStockReceiptStatusParams{
			ID:     id,
			Status: sr_repo.StockReceiptStatusCompleted,
		})
		return err
	})
	if err != nil {
		s.log.Errorf("CompleteStockReceipt failed", "error", err)
		return nil, err
	}

	return s.Get(ctx, id)
}

func (s *StockReceiptService) Cancel(ctx context.Context, id uuid.UUID) (*StockReceiptResponse, error) {
	receipt, err := s.repo.GetStockReceiptByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	if receipt.Status != sr_repo.StockReceiptStatusDraft {
		return nil, common.ErrInvalidState
	}

	_, err = s.repo.SetStockReceiptStatus(ctx, sr_repo.SetStockReceiptStatusParams{
		ID:     id,
		Status: sr_repo.StockReceiptStatusCancelled,
	})
	if err != nil {
		return nil, err
	}

	return s.Get(ctx, id)
}

func nextReceiptNo(ctx context.Context, q *sr_repo.Queries) (string, error) {
	now := time.Now()
	d := pgtype.Date{Time: now, Valid: true}
	count, err := q.CountStockReceiptsOnDate(ctx, d)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("GR-%s-%03d", now.Format("20060102"), count+1), nil
}

func insertReceiptItems(ctx context.Context, q *sr_repo.Queries, receiptID uuid.UUID, items []ReceiptItemInput) error {
	for _, it := range items {
		var cost pgtype.Numeric
		if err := cost.Scan(fmt.Sprintf("%f", it.UnitCost)); err != nil {
			return err
		}
		_, err := q.InsertStockReceiptItem(ctx, sr_repo.InsertStockReceiptItemParams{
			ReceiptID: receiptID,
			ProductID: it.ProductID,
			Quantity:  it.Quantity,
			UnitCost:  cost,
		})
		if err != nil {
			return err
		}
	}
	return nil
}

func mapReceiptDetail(r sr_repo.StockReceipt, items []sr_repo.ListStockReceiptItemsRow, total pgtype.Numeric) *StockReceiptResponse {
	resp := &StockReceiptResponse{
		ID:          r.ID,
		ReceiptNo:   r.ReceiptNo,
		Status:      string(r.Status),
		ReceivedAt:  r.ReceivedAt.Time,
		Note:        r.Note,
		TotalAmount: numericToFloat(total),
		CreatedAt:   r.CreatedAt.Time,
		UpdatedAt:   r.UpdatedAt.Time,
	}
	if r.SupplierID.Valid {
		sid := uuid.UUID(r.SupplierID.Bytes)
		resp.SupplierID = &sid
	}
	for _, it := range items {
		resp.Items = append(resp.Items, StockReceiptItemResponse{
			ID:          it.ID,
			ProductID:   it.ProductID,
			ProductName: it.ProductName,
			ProductSku:  it.ProductSku,
			Quantity:    it.Quantity,
			UnitCost:    numericToFloat(it.UnitCost),
			LineTotal:   numericToFloat(it.LineTotal),
		})
	}
	return resp
}

func mapReceiptListRow(row sr_repo.ListStockReceiptsRow, total pgtype.Numeric) StockReceiptListItem {
	item := StockReceiptListItem{
		ID:          row.ID,
		ReceiptNo:   row.ReceiptNo,
		Status:      string(row.Status),
		ReceivedAt:  row.ReceivedAt.Time,
		SupplierName: row.SupplierName,
		TotalAmount: numericToFloat(total),
		CreatedAt:   row.CreatedAt.Time,
	}
	if row.SupplierID.Valid {
		sid := uuid.UUID(row.SupplierID.Bytes)
		item.SupplierID = &sid
	}
	return item
}

func numericToFloat(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}
	f, _ := n.Float64Value()
	return f.Float64
}
