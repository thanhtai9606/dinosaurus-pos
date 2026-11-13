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
	ErrDuplicateName = errors.New("duplicate unit name")
)

func duplicateFromPg(err error) error {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) || pgErr.Code != "23505" {
		return nil
	}
	c := strings.ToLower(pgErr.ConstraintName)
	if strings.Contains(c, "code") {
		return ErrDuplicateCode
	}
	if strings.Contains(c, "name") {
		return ErrDuplicateName
	}
	return ErrDuplicateCode
}

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
	names := []string{"Cái", "Hộp", "Thùng", "Kilogram", "Lít", "Gói", "Chai", "Ly", "Phần"}
	for _, name := range names {
		if err := s.repo.InsertMeasurementUnitIfMissing(ctx, repository.InsertMeasurementUnitIfMissingParams{
			TenantID: tenantID,
			Code:     deriveUnitCode(name),
			Name:     name,
		}); err != nil {
			s.log.Errorf("SeedDefaults measurement unit %s: %v", name, err)
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
	name := strings.TrimSpace(req.Name)
	row, err := s.repo.CreateMeasurementUnit(ctx, repository.CreateMeasurementUnitParams{
		Code: deriveUnitCode(name),
		Name: name,
	})
	if err != nil {
		if dup := duplicateFromPg(err); dup != nil {
			return nil, dup
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
	name := strings.TrimSpace(req.Name)
	row, err := s.repo.UpdateMeasurementUnit(ctx, repository.UpdateMeasurementUnitParams{
		ID:   id,
		Code: deriveUnitCode(name),
		Name: name,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		if dup := duplicateFromPg(err); dup != nil {
			return nil, dup
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
