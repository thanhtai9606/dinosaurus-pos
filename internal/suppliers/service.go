package suppliers

import (
	"context"
	"errors"

	"POS-kasir/internal/common"
	"POS-kasir/internal/common/pagination"
	"POS-kasir/internal/suppliers/repository"
	"POS-kasir/pkg/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type ISupplierService interface {
	CreateSupplier(ctx context.Context, req CreateSupplierRequest) (*SupplierResponse, error)
	GetSupplier(ctx context.Context, id uuid.UUID) (*SupplierResponse, error)
	UpdateSupplier(ctx context.Context, id uuid.UUID, req UpdateSupplierRequest) (*SupplierResponse, error)
	DeleteSupplier(ctx context.Context, id uuid.UUID) error
	ListSuppliers(ctx context.Context, req ListSuppliersRequest) (*PagedSupplierResponse, error)
}

type SupplierService struct {
	repo repository.Querier
	log  logger.ILogger
}

func NewSupplierService(repo repository.Querier, log logger.ILogger) ISupplierService {
	return &SupplierService{repo: repo, log: log}
}

func (s *SupplierService) CreateSupplier(ctx context.Context, req CreateSupplierRequest) (*SupplierResponse, error) {
	active := true
	if req.IsActive != nil {
		active = *req.IsActive
	}
	sup, err := s.repo.CreateSupplier(ctx, repository.CreateSupplierParams{
		Code:     req.Code,
		Name:     req.Name,
		Phone:    req.Phone,
		Email:    req.Email,
		Address:  req.Address,
		TaxID:    req.TaxID,
		Notes:    req.Notes,
		IsActive: active,
	})
	if err != nil {
		s.log.Errorf("CreateSupplier failed", "error", err)
		return nil, err
	}
	return mapSupplier(sup), nil
}

func (s *SupplierService) GetSupplier(ctx context.Context, id uuid.UUID) (*SupplierResponse, error) {
	sup, err := s.repo.GetSupplierByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	return mapSupplier(sup), nil
}

func (s *SupplierService) UpdateSupplier(ctx context.Context, id uuid.UUID, req UpdateSupplierRequest) (*SupplierResponse, error) {
	sup, err := s.repo.UpdateSupplier(ctx, repository.UpdateSupplierParams{
		ID:       id,
		Code:     req.Code,
		Name:     req.Name,
		Phone:    req.Phone,
		Email:    req.Email,
		Address:  req.Address,
		TaxID:    req.TaxID,
		Notes:    req.Notes,
		IsActive: req.IsActive,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		s.log.Errorf("UpdateSupplier failed", "error", err)
		return nil, err
	}
	return mapSupplier(sup), nil
}

func (s *SupplierService) DeleteSupplier(ctx context.Context, id uuid.UUID) error {
	err := s.repo.DeleteSupplier(ctx, id)
	if err != nil {
		s.log.Errorf("DeleteSupplier failed", "error", err)
		return err
	}
	return nil
}

func (s *SupplierService) ListSuppliers(ctx context.Context, req ListSuppliersRequest) (*PagedSupplierResponse, error) {
	req.SetDefaults()
	limit := req.Limit
	offset := (req.Page - 1) * limit

	var search *string
	if req.Search != "" {
		search = &req.Search
	}

	sups, err := s.repo.ListSuppliers(ctx, repository.ListSuppliersParams{
		Limit:  int32(limit),
		Offset: int32(offset),
		Search: search,
	})
	if err != nil {
		s.log.Errorf("ListSuppliers failed", "error", err)
		return nil, err
	}

	count, err := s.repo.CountSuppliers(ctx, search)
	if err != nil {
		return nil, err
	}

	var responses []SupplierResponse
	for _, sup := range sups {
		responses = append(responses, *mapSupplier(sup))
	}

	return &PagedSupplierResponse{
		Suppliers:  responses,
		Pagination: pagination.BuildPagination(req.Page, int(count), limit),
	}, nil
}

func mapSupplier(s repository.Supplier) *SupplierResponse {
	return &SupplierResponse{
		ID:        s.ID,
		Code:      s.Code,
		Name:      s.Name,
		Phone:     s.Phone,
		Email:     s.Email,
		Address:   s.Address,
		TaxID:     s.TaxID,
		Notes:     s.Notes,
		IsActive:  s.IsActive,
		CreatedAt: s.CreatedAt.Time,
		UpdatedAt: s.UpdatedAt.Time,
	}
}
