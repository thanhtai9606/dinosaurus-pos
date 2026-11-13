package measurementunits

import (
	"context"
	"errors"
	"strings"

	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/internal/common/pagination"
	"dinosaurus-pos/internal/measurementunits/repository"
	"dinosaurus-pos/internal/tenant"
	"dinosaurus-pos/pkg/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

var (
	ErrInUse         = errors.New("measurement unit in use")
	ErrDuplicateCode = errors.New("duplicate unit code")
)

type IService interface {
	Create(ctx context.Context, req CreateMeasurementUnitRequest) (*MeasurementUnitResponse, error)
	Get(ctx context.Context, id uuid.UUID) (*MeasurementUnitResponse, error)
	Update(ctx context.Context, id uuid.UUID, req UpdateMeasurementUnitRequest) (*MeasurementUnitResponse, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, req ListMeasurementUnitsRequest) (*PagedMeasurementUnitsResponse, error)
	SeedDefaults(ctx context.Context, tenantID uuid.UUID) error
}

type Service struct {
	repo repository.Querier
	log  logger.ILogger
}

func NewService(repo repository.Querier, log logger.ILogger) IService {
	return &Service{repo: repo, log: log}
}

func (s *Service) SeedDefaults(ctx context.Context, tenantID uuid.UUID) error {
	ctx = tenant.WithID(ctx, tenantID)
	defaults := []struct{ code, name string }{
		{"PCS", "Cái"},
		{"HOP", "Hộp"},
		{"THUNG", "Thùng"},
		{"KG", "Kilogram"},
		{"L", "Lít"},
		{"GOI", "Gói"},
		{"CHAI", "Chai"},
	}
	for _, d := range defaults {
		if err := s.repo.InsertMeasurementUnitIfMissing(ctx, repository.InsertMeasurementUnitIfMissingParams{
			TenantID: tenantID,
			Code:     d.code,
			Name:     d.name,
		}); err != nil {
			s.log.Errorf("SeedDefaults measurement unit %s: %v", d.code, err)
			return err
		}
	}
	return nil
}

func mapUnit(row repository.MeasurementUnit) *MeasurementUnitResponse {
	return &MeasurementUnitResponse{
		ID:        row.ID,
		Code:      row.Code,
		Name:      row.Name,
		CreatedAt: row.CreatedAt.Time,
		UpdatedAt: row.UpdatedAt.Time,
	}
}

func (s *Service) Create(ctx context.Context, req CreateMeasurementUnitRequest) (*MeasurementUnitResponse, error) {
	row, err := s.repo.CreateMeasurementUnit(ctx, repository.CreateMeasurementUnitParams{
		Code: strings.ToUpper(strings.TrimSpace(req.Code)),
		Name: strings.TrimSpace(req.Name),
	})
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrDuplicateCode
		}
		s.log.Errorf("CreateMeasurementUnit failed: %v", err)
		return nil, err
	}
	return mapUnit(row), nil
}

func (s *Service) Get(ctx context.Context, id uuid.UUID) (*MeasurementUnitResponse, error) {
	row, err := s.repo.GetMeasurementUnitByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	return mapUnit(row), nil
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, req UpdateMeasurementUnitRequest) (*MeasurementUnitResponse, error) {
	row, err := s.repo.UpdateMeasurementUnit(ctx, repository.UpdateMeasurementUnitParams{
		ID:   id,
		Code: strings.ToUpper(strings.TrimSpace(req.Code)),
		Name: strings.TrimSpace(req.Name),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrDuplicateCode
		}
		s.log.Errorf("UpdateMeasurementUnit failed: %v", err)
		return nil, err
	}
	return mapUnit(row), nil
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	row, err := s.repo.GetMeasurementUnitByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return common.ErrNotFound
		}
		return err
	}
	count, err := s.repo.CountProductsUsingMeasurementUnit(ctx, repository.CountProductsUsingMeasurementUnitParams{
		Code: row.Code,
		Name: row.Name,
	})
	if err != nil {
		s.log.Errorf("CountProductsUsingMeasurementUnit: %v", err)
		return err
	}
	if count > 0 {
		return ErrInUse
	}
	if err := s.repo.DeleteMeasurementUnit(ctx, id); err != nil {
		s.log.Errorf("DeleteMeasurementUnit failed: %v", err)
		return err
	}
	return nil
}

func (s *Service) List(ctx context.Context, req ListMeasurementUnitsRequest) (*PagedMeasurementUnitsResponse, error) {
	req.SetDefaults()
	limit := req.Limit
	offset := (req.Page - 1) * limit
	var search *string
	if q := strings.TrimSpace(req.Search); q != "" {
		search = &q
	}
	rows, err := s.repo.ListMeasurementUnits(ctx, repository.ListMeasurementUnitsParams{
		Limit:  int32(limit),
		Offset: int32(offset),
		Search: search,
	})
	if err != nil {
		return nil, err
	}
	total, err := s.repo.CountMeasurementUnits(ctx, search)
	if err != nil {
		return nil, err
	}
	units := make([]MeasurementUnitResponse, 0, len(rows))
	for _, row := range rows {
		units = append(units, *mapUnit(row))
	}
	return &PagedMeasurementUnitsResponse{
		Units: units,
		Pagination: pagination.BuildPagination(req.Page, int(total), limit),
	}, nil
}
