package stockops

import (
	"context"
	"errors"
	"fmt"
	"time"

	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/internal/common/pagination"
	"dinosaurus-pos/internal/common/store"
	"dinosaurus-pos/internal/inventory"
	products_repo "dinosaurus-pos/internal/products/repository"
	ops_repo "dinosaurus-pos/internal/stockops/repository"
	"dinosaurus-pos/internal/tenant"
	wh_repo "dinosaurus-pos/internal/warehouse/repository"
	"dinosaurus-pos/pkg/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type IService interface {
	CreateAdjustment(ctx context.Context, req CreateAdjustmentRequest) (*AdjustmentResponse, error)
	GetAdjustment(ctx context.Context, id uuid.UUID) (*AdjustmentResponse, error)
	ListAdjustments(ctx context.Context, req ListAdjustmentsRequest) (*PagedAdjustmentsResponse, error)
	UpdateAdjustment(ctx context.Context, id uuid.UUID, req UpdateAdjustmentRequest) (*AdjustmentResponse, error)
	CompleteAdjustment(ctx context.Context, id uuid.UUID) (*AdjustmentResponse, error)

	CreateTransfer(ctx context.Context, req CreateTransferRequest) (*TransferResponse, error)
	GetTransfer(ctx context.Context, id uuid.UUID) (*TransferResponse, error)
	ListTransfers(ctx context.Context, req ListTransfersRequest) (*PagedTransfersResponse, error)
	UpdateTransfer(ctx context.Context, id uuid.UUID, req UpdateTransferRequest) (*TransferResponse, error)
	CompleteTransfer(ctx context.Context, id uuid.UUID) (*TransferResponse, error)

	CreateStockTake(ctx context.Context, req CreateStockTakeRequest) (*StockTakeResponse, error)
	GetStockTake(ctx context.Context, id uuid.UUID) (*StockTakeResponse, error)
	ListStockTakes(ctx context.Context, req ListStockTakesRequest) (*PagedStockTakesResponse, error)
	UpdateStockTake(ctx context.Context, id uuid.UUID, req UpdateStockTakeRequest) (*StockTakeResponse, error)
	PostStockTake(ctx context.Context, id uuid.UUID) (*StockTakeResponse, error)

	ListStockMovements(ctx context.Context, req ListStockMovementsRequest) (*PagedStockMovementsResponse, error)
}

type Service struct {
	repo  *ops_repo.Queries
	store store.Store
	log   logger.ILogger
}

func NewService(repo *ops_repo.Queries, st store.Store, log logger.ILogger) IService {
	return &Service{repo: repo, store: st, log: log}
}

func actorID(ctx context.Context) pgtype.UUID {
	if id, ok := ctx.Value(common.UserIDKey).(uuid.UUID); ok {
		return pgtype.UUID{Bytes: id, Valid: true}
	}
	return pgtype.UUID{}
}

func nextDocNo(ctx context.Context, prefix string, countFn func(context.Context, time.Time) (int32, error)) (string, error) {
	now := time.Now()
	count, err := countFn(ctx, now)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s-%s-%03d", prefix, now.Format("20060102"), count+1), nil
}

func parseReason(s string) products_repo.StockChangeType {
	switch s {
	case "damage":
		return products_repo.StockChangeTypeDamage
	case "restock":
		return products_repo.StockChangeTypeRestock
	default:
		return products_repo.StockChangeTypeCorrection
	}
}

func (s *Service) CreateAdjustment(ctx context.Context, req CreateAdjustmentRequest) (*AdjustmentResponse, error) {
	tenantID, ok := tenant.IDFromContext(ctx)
	if !ok {
		return nil, common.ErrUnauthorized
	}
	var id uuid.UUID
	err := s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		q := ops_repo.New(tx)
		docNo, err := nextDocNo(ctx, "ADJ", func(c context.Context, day time.Time) (int32, error) {
			return q.CountStockAdjustmentsOnDate(c, day)
		})
		if err != nil {
			return err
		}
		reason := parseReason(req.Reason)
		row, err := q.CreateStockAdjustment(ctx, tenantID, docNo, req.WarehouseID, reason, req.Note, actorID(ctx))
		if err != nil {
			return err
		}
		id = row.ID
		for _, it := range req.Items {
			if _, err := q.InsertStockAdjustmentItem(ctx, id, it.ProductID, it.QuantityDelta, it.Note); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		s.log.Errorf("CreateAdjustment: %v", err)
		return nil, err
	}
	return s.GetAdjustment(ctx, id)
}

func (s *Service) GetAdjustment(ctx context.Context, id uuid.UUID) (*AdjustmentResponse, error) {
	row, err := s.repo.GetStockAdjustmentByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	items, err := s.repo.ListStockAdjustmentItems(ctx, id)
	if err != nil {
		return nil, err
	}
	return mapAdjustment(row, items), nil
}

func (s *Service) ListAdjustments(ctx context.Context, req ListAdjustmentsRequest) (*PagedAdjustmentsResponse, error) {
	req.SetDefaults()
	var status *ops_repo.StockDocStatus
	if req.Status != nil {
		st := ops_repo.StockDocStatus(*req.Status)
		status = &st
	}
	rows, err := s.repo.ListStockAdjustments(ctx, int32(req.Limit), int32((req.Page-1)*req.Limit), status, req.WarehouseID)
	if err != nil {
		return nil, err
	}
	count, err := s.repo.CountStockAdjustments(ctx, status, req.WarehouseID)
	if err != nil {
		return nil, err
	}
	var out []AdjustmentResponse
	for _, r := range rows {
		out = append(out, *mapAdjustment(r, nil))
	}
	return &PagedAdjustmentsResponse{
		Adjustments: out,
		Pagination:  pagination.BuildPagination(req.Page, int(count), req.Limit),
	}, nil
}

func (s *Service) UpdateAdjustment(ctx context.Context, id uuid.UUID, req UpdateAdjustmentRequest) (*AdjustmentResponse, error) {
	err := s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		q := ops_repo.New(tx)
		reason := parseReason(req.Reason)
		if _, err := q.UpdateStockAdjustmentDraft(ctx, id, req.WarehouseID, reason, req.Note); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.ErrInvalidState
			}
			return err
		}
		if err := q.DeleteStockAdjustmentItems(ctx, id); err != nil {
			return err
		}
		for _, it := range req.Items {
			if _, err := q.InsertStockAdjustmentItem(ctx, id, it.ProductID, it.QuantityDelta, it.Note); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.GetAdjustment(ctx, id)
}

func (s *Service) CompleteAdjustment(ctx context.Context, id uuid.UUID) (*AdjustmentResponse, error) {
	err := s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		q := ops_repo.New(tx)
		prd := products_repo.New(tx)
		wh := wh_repo.New(tx)

		adj, err := q.GetStockAdjustmentByID(ctx, id)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.ErrNotFound
			}
			return err
		}
		if adj.Status != ops_repo.StockDocStatusDraft {
			return common.ErrInvalidState
		}
		items, err := q.ListStockAdjustmentItems(ctx, id)
		if err != nil {
			return err
		}
		if len(items) == 0 {
			return common.ErrInvalidInput
		}
		ref := pgtype.UUID{Bytes: id, Valid: true}
		note := fmt.Sprintf("Adjustment %s", adj.DocNo)
		for _, line := range items {
			if line.QuantityDelta == 0 {
				continue
			}
			if err := inventory.ApplyWarehouseDelta(ctx, prd, wh, adj.WarehouseID, line.ProductID, line.QuantityDelta, adj.Reason, ref, &note, actorID(ctx)); err != nil {
				return err
			}
		}
		if _, err := q.CompleteStockAdjustment(ctx, id); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.ErrInvalidState
			}
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.GetAdjustment(ctx, id)
}

func (s *Service) CreateTransfer(ctx context.Context, req CreateTransferRequest) (*TransferResponse, error) {
	if req.FromWarehouseID == req.ToWarehouseID {
		return nil, fmt.Errorf("%w: warehouses must differ", common.ErrInvalidInput)
	}
	tenantID, ok := tenant.IDFromContext(ctx)
	if !ok {
		return nil, common.ErrUnauthorized
	}
	var id uuid.UUID
	err := s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		q := ops_repo.New(tx)
		docNo, err := nextDocNo(ctx, "TRF", func(c context.Context, day time.Time) (int32, error) {
			return q.CountStockTransfersOnDate(c, day)
		})
		if err != nil {
			return err
		}
		row, err := q.CreateStockTransfer(ctx, tenantID, docNo, req.FromWarehouseID, req.ToWarehouseID, req.Note, actorID(ctx))
		if err != nil {
			return err
		}
		id = row.ID
		for _, it := range req.Items {
			if _, err := q.InsertStockTransferItem(ctx, id, it.ProductID, it.Quantity); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.GetTransfer(ctx, id)
}

func (s *Service) GetTransfer(ctx context.Context, id uuid.UUID) (*TransferResponse, error) {
	row, err := s.repo.GetStockTransferByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	items, _ := s.repo.ListStockTransferItems(ctx, id)
	return mapTransfer(row, items), nil
}

func (s *Service) ListTransfers(ctx context.Context, req ListTransfersRequest) (*PagedTransfersResponse, error) {
	req.SetDefaults()
	var status *ops_repo.StockDocStatus
	if req.Status != nil {
		st := ops_repo.StockDocStatus(*req.Status)
		status = &st
	}
	rows, err := s.repo.ListStockTransfers(ctx, int32(req.Limit), int32((req.Page-1)*req.Limit), status)
	if err != nil {
		return nil, err
	}
	count, err := s.repo.CountStockTransfers(ctx, status)
	if err != nil {
		return nil, err
	}
	var out []TransferResponse
	for _, r := range rows {
		out = append(out, *mapTransfer(r, nil))
	}
	return &PagedTransfersResponse{Transfers: out, Pagination: pagination.BuildPagination(req.Page, int(count), req.Limit)}, nil
}

func (s *Service) UpdateTransfer(ctx context.Context, id uuid.UUID, req UpdateTransferRequest) (*TransferResponse, error) {
	if req.FromWarehouseID == req.ToWarehouseID {
		return nil, fmt.Errorf("%w: warehouses must differ", common.ErrInvalidInput)
	}
	err := s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		q := ops_repo.New(tx)
		if _, err := q.UpdateStockTransferDraft(ctx, id, req.FromWarehouseID, req.ToWarehouseID, req.Note); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.ErrInvalidState
			}
			return err
		}
		if err := q.DeleteStockTransferItems(ctx, id); err != nil {
			return err
		}
		for _, it := range req.Items {
			if _, err := q.InsertStockTransferItem(ctx, id, it.ProductID, it.Quantity); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.GetTransfer(ctx, id)
}

func (s *Service) CompleteTransfer(ctx context.Context, id uuid.UUID) (*TransferResponse, error) {
	err := s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		q := ops_repo.New(tx)
		prd := products_repo.New(tx)
		wh := wh_repo.New(tx)
		tr, err := q.GetStockTransferByID(ctx, id)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.ErrNotFound
			}
			return err
		}
		if tr.Status != ops_repo.StockDocStatusDraft {
			return common.ErrInvalidState
		}
		items, err := q.ListStockTransferItems(ctx, id)
		if err != nil {
			return err
		}
		if len(items) == 0 {
			return common.ErrInvalidInput
		}
		ref := pgtype.UUID{Bytes: id, Valid: true}
		outNote := fmt.Sprintf("Transfer %s out", tr.DocNo)
		inNote := fmt.Sprintf("Transfer %s in", tr.DocNo)
		for _, line := range items {
			if err := inventory.ApplyWarehouseDelta(ctx, prd, wh, tr.FromWarehouseID, line.ProductID, -line.Quantity, products_repo.StockChangeTypeTransferOut, ref, &outNote, actorID(ctx)); err != nil {
				return err
			}
			if err := inventory.ApplyWarehouseDelta(ctx, prd, wh, tr.ToWarehouseID, line.ProductID, line.Quantity, products_repo.StockChangeTypeTransferIn, ref, &inNote, actorID(ctx)); err != nil {
				return err
			}
		}
		if _, err := q.CompleteStockTransfer(ctx, id); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.ErrInvalidState
			}
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.GetTransfer(ctx, id)
}

func (s *Service) CreateStockTake(ctx context.Context, req CreateStockTakeRequest) (*StockTakeResponse, error) {
	tenantID, ok := tenant.IDFromContext(ctx)
	if !ok {
		return nil, common.ErrUnauthorized
	}
	var id uuid.UUID
	err := s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		q := ops_repo.New(tx)
		wh := wh_repo.New(tx)
		docNo, err := nextDocNo(ctx, "STK", func(c context.Context, day time.Time) (int32, error) {
			return q.CountStockTakesOnDate(c, day)
		})
		if err != nil {
			return err
		}
		row, err := q.CreateStockTake(ctx, tenantID, docNo, req.WarehouseID, req.Note, actorID(ctx))
		if err != nil {
			return err
		}
		id = row.ID
		return insertStockTakeItems(ctx, q, wh, id, req.WarehouseID, req.Items)
	})
	if err != nil {
		return nil, err
	}
	return s.GetStockTake(ctx, id)
}

func insertStockTakeItems(ctx context.Context, q *ops_repo.Queries, wh *wh_repo.Queries, stockTakeID, warehouseID uuid.UUID, items []StockTakeItemInput) error {
	for _, it := range items {
		sysQty := int32(0)
		if ws, err := wh.GetWarehouseStock(ctx, warehouseID, it.ProductID); err == nil {
			sysQty = ws.Quantity
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		if _, err := q.InsertStockTakeItem(ctx, stockTakeID, it.ProductID, sysQty, it.CountedQty); err != nil {
			return err
		}
	}
	return nil
}

func (s *Service) GetStockTake(ctx context.Context, id uuid.UUID) (*StockTakeResponse, error) {
	row, err := s.repo.GetStockTakeByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	items, _ := s.repo.ListStockTakeItems(ctx, id)
	return mapStockTake(row, items), nil
}

func (s *Service) ListStockTakes(ctx context.Context, req ListStockTakesRequest) (*PagedStockTakesResponse, error) {
	req.SetDefaults()
	var status *ops_repo.StockTakeStatus
	if req.Status != nil {
		st := ops_repo.StockTakeStatus(*req.Status)
		status = &st
	}
	rows, err := s.repo.ListStockTakes(ctx, int32(req.Limit), int32((req.Page-1)*req.Limit), status)
	if err != nil {
		return nil, err
	}
	count, err := s.repo.CountStockTakes(ctx, status)
	if err != nil {
		return nil, err
	}
	var out []StockTakeResponse
	for _, r := range rows {
		out = append(out, *mapStockTake(r, nil))
	}
	return &PagedStockTakesResponse{StockTakes: out, Pagination: pagination.BuildPagination(req.Page, int(count), req.Limit)}, nil
}

func (s *Service) UpdateStockTake(ctx context.Context, id uuid.UUID, req UpdateStockTakeRequest) (*StockTakeResponse, error) {
	err := s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		q := ops_repo.New(tx)
		wh := wh_repo.New(tx)
		if _, err := q.UpdateStockTakeDraft(ctx, id, req.WarehouseID, req.Note); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.ErrInvalidState
			}
			return err
		}
		if err := q.DeleteStockTakeItems(ctx, id); err != nil {
			return err
		}
		return insertStockTakeItems(ctx, q, wh, id, req.WarehouseID, req.Items)
	})
	if err != nil {
		return nil, err
	}
	return s.GetStockTake(ctx, id)
}

func (s *Service) PostStockTake(ctx context.Context, id uuid.UUID) (*StockTakeResponse, error) {
	err := s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		q := ops_repo.New(tx)
		prd := products_repo.New(tx)
		wh := wh_repo.New(tx)
		st, err := q.GetStockTakeByID(ctx, id)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.ErrNotFound
			}
			return err
		}
		if st.Status != ops_repo.StockTakeStatusDraft && st.Status != ops_repo.StockTakeStatusCounting {
			return common.ErrInvalidState
		}
		items, err := q.ListStockTakeItems(ctx, id)
		if err != nil {
			return err
		}
		if len(items) == 0 {
			return common.ErrInvalidInput
		}
		ref := pgtype.UUID{Bytes: id, Valid: true}
		note := fmt.Sprintf("Stock take %s", st.DocNo)
		for _, line := range items {
			if !line.CountedQty.Valid {
				return fmt.Errorf("%w: missing counted quantity for %s", common.ErrInvalidInput, line.ProductName)
			}
			delta := line.CountedQty.Int32 - line.SystemQty
			if delta == 0 {
				continue
			}
			if err := inventory.ApplyWarehouseDelta(ctx, prd, wh, st.WarehouseID, line.ProductID, delta, products_repo.StockChangeTypeCount, ref, &note, actorID(ctx)); err != nil {
				return err
			}
		}
		if _, err := q.SetStockTakeStatus(ctx, id, ops_repo.StockTakeStatusPosted); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.GetStockTake(ctx, id)
}

func (s *Service) ListStockMovements(ctx context.Context, req ListStockMovementsRequest) (*PagedStockMovementsResponse, error) {
	req.SetDefaults()
	var changeType *products_repo.StockChangeType
	if req.ChangeType != nil {
		ct := products_repo.StockChangeType(*req.ChangeType)
		changeType = &ct
	}
	rows, err := s.repo.ListStockMovements(ctx, int32(req.Limit), int32((req.Page-1)*req.Limit), req.ProductID, req.WarehouseID, changeType, req.FromAt, req.ToAt)
	if err != nil {
		return nil, err
	}
	count, err := s.repo.CountStockMovements(ctx, req.ProductID, req.WarehouseID, changeType, req.FromAt, req.ToAt)
	if err != nil {
		return nil, err
	}
	var out []StockMovementResponse
	for _, r := range rows {
		out = append(out, mapMovement(r))
	}
	return &PagedStockMovementsResponse{Movements: out, Pagination: pagination.BuildPagination(req.Page, int(count), req.Limit)}, nil
}

func mapAdjustment(row ops_repo.StockAdjustmentRow, items []ops_repo.StockAdjustmentItemRow) *AdjustmentResponse {
	resp := &AdjustmentResponse{
		ID:            row.ID,
		DocNo:         row.DocNo,
		WarehouseID:   row.WarehouseID,
		WarehouseName: row.WarehouseName,
		Status:        string(row.Status),
		Reason:        string(row.Reason),
		Note:          row.Note,
		CreatedAt:     row.CreatedAt,
		UpdatedAt:     row.UpdatedAt,
	}
	if row.CompletedAt.Valid {
		t := row.CompletedAt.Time
		resp.CompletedAt = &t
	}
	for _, it := range items {
		resp.Items = append(resp.Items, AdjustmentItemResponse{
			ID: it.ID, ProductID: it.ProductID, ProductName: it.ProductName, Code: it.Code, Sku: it.Sku,
			QuantityDelta: it.QuantityDelta, Note: it.Note,
		})
	}
	return resp
}

func mapTransfer(row ops_repo.StockTransferRow, items []ops_repo.StockTransferItemRow) *TransferResponse {
	resp := &TransferResponse{
		ID: row.ID, DocNo: row.DocNo,
		FromWarehouseID: row.FromWarehouseID, FromWarehouseName: row.FromWarehouseName,
		ToWarehouseID: row.ToWarehouseID, ToWarehouseName: row.ToWarehouseName,
		Status: string(row.Status), Note: row.Note,
		CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
	}
	if row.CompletedAt.Valid {
		t := row.CompletedAt.Time
		resp.CompletedAt = &t
	}
	for _, it := range items {
		resp.Items = append(resp.Items, TransferItemResponse{
			ID: it.ID, ProductID: it.ProductID, ProductName: it.ProductName, Code: it.Code, Sku: it.Sku, Quantity: it.Quantity,
		})
	}
	return resp
}

func mapStockTake(row ops_repo.StockTakeRow, items []ops_repo.StockTakeItemRow) *StockTakeResponse {
	resp := &StockTakeResponse{
		ID: row.ID, DocNo: row.DocNo, WarehouseID: row.WarehouseID, WarehouseName: row.WarehouseName,
		Status: string(row.Status), Note: row.Note, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
	}
	if row.PostedAt.Valid {
		t := row.PostedAt.Time
		resp.PostedAt = &t
	}
	for _, it := range items {
		var counted *int32
		if it.CountedQty.Valid {
			v := it.CountedQty.Int32
			counted = &v
		}
		resp.Items = append(resp.Items, StockTakeItemResponse{
			ID: it.ID, ProductID: it.ProductID, ProductName: it.ProductName, Code: it.Code, Sku: it.Sku,
			SystemQty: it.SystemQty, CountedQty: counted,
		})
	}
	return resp
}

func mapMovement(r ops_repo.StockMovementRow) StockMovementResponse {
	resp := StockMovementResponse{
		ID: r.ID, ProductID: r.ProductID, ProductName: r.ProductName, Code: r.Code,
		ChangeAmount: r.ChangeAmount, PreviousStock: r.PreviousStock, CurrentStock: r.CurrentStock,
		ChangeType: string(r.ChangeType), Note: r.Note, CreatedAt: r.CreatedAt,
	}
	if r.WarehouseID.Valid {
		wid := uuid.UUID(r.WarehouseID.Bytes)
		resp.WarehouseID = &wid
	}
	resp.WarehouseName = r.WarehouseName
	if r.ReferenceID.Valid {
		rid := uuid.UUID(r.ReferenceID.Bytes)
		resp.ReferenceID = &rid
	}
	return resp
}