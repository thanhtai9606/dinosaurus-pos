package warehouse

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/internal/common/pagination"
	"dinosaurus-pos/internal/tenant"
	wh_repo "dinosaurus-pos/internal/warehouse/repository"
	"dinosaurus-pos/pkg/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type IService interface {
	Create(ctx context.Context, req CreateWarehouseRequest) (*WarehouseResponse, error)
	Get(ctx context.Context, id uuid.UUID) (*WarehouseResponse, error)
	Update(ctx context.Context, id uuid.UUID, req UpdateWarehouseRequest) (*WarehouseResponse, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, req ListWarehousesRequest) (*PagedWarehousesResponse, error)
	ListStock(ctx context.Context, warehouseID uuid.UUID, req ListWarehouseStockRequest) (*PagedWarehouseStockResponse, error)
	SeedDefaults(ctx context.Context, tenantID uuid.UUID) error
}

type Service struct {
	repo *wh_repo.Queries
	log  logger.ILogger
}

func NewService(repo *wh_repo.Queries, log logger.ILogger) IService {
	return &Service{repo: repo, log: log}
}

func (s *Service) SeedDefaults(ctx context.Context, tenantID uuid.UUID) error {
	return NewSeeder(s.repo, s.log).SeedDefaults(ctx, tenantID)
}

func (s *Service) Create(ctx context.Context, req CreateWarehouseRequest) (*WarehouseResponse, error) {
	tenantID, ok := tenant.IDFromContext(ctx)
	if !ok {
		return nil, common.ErrUnauthorized
	}
	isDefault := false
	if req.IsDefault != nil {
		isDefault = *req.IsDefault
	}
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	if isDefault {
		if err := s.repo.ClearDefaultWarehouse(ctx, tenantID); err != nil {
			return nil, err
		}
	}
	code := strings.TrimSpace(strings.ToUpper(req.Code))
	row, err := s.repo.CreateWarehouse(ctx, tenantID, code, strings.TrimSpace(req.Name), isDefault, isActive)
	if err != nil {
		s.log.Errorf("CreateWarehouse failed: %v", err)
		return nil, err
	}
	return mapWarehouse(row), nil
}

func (s *Service) Get(ctx context.Context, id uuid.UUID) (*WarehouseResponse, error) {
	tenantID, ok := tenant.IDFromContext(ctx)
	if !ok {
		return nil, common.ErrUnauthorized
	}
	row, err := s.repo.GetWarehouseByID(ctx, tenantID, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	return mapWarehouse(row), nil
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, req UpdateWarehouseRequest) (*WarehouseResponse, error) {
	tenantID, ok := tenant.IDFromContext(ctx)
	if !ok {
		return nil, common.ErrUnauthorized
	}
	cur, err := s.repo.GetWarehouseByID(ctx, tenantID, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	code := cur.Code
	name := cur.Name
	isDefault := cur.IsDefault
	isActive := cur.IsActive
	if req.Code != nil {
		code = strings.TrimSpace(*req.Code)
	}
	if req.Name != nil {
		name = strings.TrimSpace(*req.Name)
	}
	if req.IsDefault != nil {
		isDefault = *req.IsDefault
	}
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	if cur.IsDefault && req.IsDefault != nil && !*req.IsDefault {
		return nil, fmt.Errorf("%w: assign another default warehouse first", common.ErrInvalidInput)
	}
	if cur.IsDefault && !isActive {
		return nil, fmt.Errorf("%w: cannot deactivate the default warehouse", common.ErrInvalidInput)
	}
	if isDefault && !cur.IsDefault {
		if err := s.repo.ClearDefaultWarehouse(ctx, tenantID); err != nil {
			return nil, err
		}
	}
	if req.Code != nil {
		code = strings.TrimSpace(strings.ToUpper(code))
	}
	row, err := s.repo.UpdateWarehouse(ctx, tenantID, id, code, name, isDefault, isActive)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	return mapWarehouse(row), nil
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	tenantID, ok := tenant.IDFromContext(ctx)
	if !ok {
		return common.ErrUnauthorized
	}
	cur, err := s.repo.GetWarehouseByID(ctx, tenantID, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return common.ErrNotFound
		}
		return err
	}
	if cur.IsDefault {
		return fmt.Errorf("%w: cannot delete the default warehouse", common.ErrInvalidInput)
	}
	hasStock, err := s.repo.WarehouseHasPositiveStock(ctx, id)
	if err != nil {
		return err
	}
	if hasStock {
		return fmt.Errorf("%w: warehouse still has stock", common.ErrInvalidInput)
	}
	if err := s.repo.DeleteWarehouse(ctx, tenantID, id); err != nil {
		return err
	}
	return nil
}

func (s *Service) List(ctx context.Context, req ListWarehousesRequest) (*PagedWarehousesResponse, error) {
	tenantID, ok := tenant.IDFromContext(ctx)
	if !ok {
		return nil, common.ErrUnauthorized
	}
	req.SetDefaults()
	limit := req.Limit
	offset := (req.Page - 1) * limit
	var search *string
	if q := strings.TrimSpace(req.Search); q != "" {
		search = &q
	}
	activeOnly := false
	if req.ActiveOnly != nil {
		activeOnly = *req.ActiveOnly
	}
	rows, err := s.repo.ListWarehouses(ctx, tenantID, int32(limit), int32(offset), search, activeOnly)
	if err != nil {
		return nil, err
	}
	count, err := s.repo.CountWarehouses(ctx, tenantID, search, activeOnly)
	if err != nil {
		return nil, err
	}
	var out []WarehouseResponse
	for _, r := range rows {
		out = append(out, *mapWarehouse(r))
	}
	return &PagedWarehousesResponse{
		Warehouses: out,
		Pagination: pagination.BuildPagination(req.Page, int(count), limit),
	}, nil
}

type ListWarehouseStockRequest struct {
	pagination.PaginationRequest
	Search       string `query:"search"`
	LowStockOnly *bool  `query:"low_stock_only"`
}

func (s *Service) ListStock(ctx context.Context, warehouseID uuid.UUID, req ListWarehouseStockRequest) (*PagedWarehouseStockResponse, error) {
	tenantID, ok := tenant.IDFromContext(ctx)
	if !ok {
		return nil, common.ErrUnauthorized
	}
	if _, err := s.repo.GetWarehouseByID(ctx, tenantID, warehouseID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	req.SetDefaults()
	limit := req.Limit
	offset := (req.Page - 1) * limit
	var search *string
	if q := strings.TrimSpace(req.Search); q != "" {
		search = &q
	}
	lowOnly := false
	if req.LowStockOnly != nil {
		lowOnly = *req.LowStockOnly
	}
	rows, err := s.repo.ListWarehouseStockByWarehouse(ctx, warehouseID, int32(limit), int32(offset), search, lowOnly)
	if err != nil {
		return nil, err
	}
	count, err := s.repo.CountWarehouseStockByWarehouse(ctx, warehouseID, search, lowOnly)
	if err != nil {
		return nil, err
	}
	var lines []WarehouseStockLine
	for _, r := range rows {
		lines = append(lines, WarehouseStockLine{
			ProductID:   r.ProductID,
			ProductName: r.ProductName,
			Code:        r.Code,
			Sku:         r.Sku,
			Unit:        r.Unit,
			Quantity:    r.Quantity,
			MinStock:    r.MinStock,
		})
	}
	return &PagedWarehouseStockResponse{
		Lines:      lines,
		Pagination: pagination.BuildPagination(req.Page, int(count), limit),
	}, nil
}

func mapWarehouse(w wh_repo.Warehouse) *WarehouseResponse {
	return &WarehouseResponse{
		ID:        w.ID,
		Code:      w.Code,
		Name:      w.Name,
		IsDefault: w.IsDefault,
		IsActive:  w.IsActive,
		CreatedAt: w.CreatedAt,
		UpdatedAt: w.UpdatedAt,
	}
}