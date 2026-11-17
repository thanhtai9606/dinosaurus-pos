package dining

import (
	"context"
	"errors"
	"fmt"

	"dinosaurus-pos/internal/common"
	dining_repo "dinosaurus-pos/internal/dining/repository"
	"dinosaurus-pos/pkg/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type IService interface {
	ListAreas(ctx context.Context) ([]DiningAreaResponse, error)
	CreateArea(ctx context.Context, req CreateDiningAreaRequest) (*DiningAreaResponse, error)
	UpdateArea(ctx context.Context, id uuid.UUID, req UpdateDiningAreaRequest) (*DiningAreaResponse, error)
	DeleteArea(ctx context.Context, id uuid.UUID) error
	ListTables(ctx context.Context) ([]DiningTableResponse, error)
	CreateTable(ctx context.Context, req CreateDiningTableRequest) (*DiningTableResponse, error)
	UpdateTable(ctx context.Context, id uuid.UUID, req UpdateDiningTableRequest) (*DiningTableResponse, error)
	DeleteTable(ctx context.Context, id uuid.UUID) error
	UpdateTableStatus(ctx context.Context, id uuid.UUID, req UpdateTableStatusRequest) (*DiningTableResponse, error)
}

type Service struct {
	repo *dining_repo.Queries
	log  logger.ILogger
}

func NewService(repo *dining_repo.Queries, log logger.ILogger) IService {
	return &Service{repo: repo, log: log}
}

func (s *Service) CreateArea(ctx context.Context, req CreateDiningAreaRequest) (*DiningAreaResponse, error) {
	sortOrder := int32(0)
	if req.SortOrder != nil {
		sortOrder = int32(*req.SortOrder)
	}
	row, err := s.repo.CreateDiningArea(ctx, dining_repo.CreateDiningAreaParams{
		Name:      req.Name,
		SortOrder: sortOrder,
	})
	if err != nil {
		return nil, err
	}
	return &DiningAreaResponse{
		ID: row.ID, Name: row.Name, SortOrder: int(row.SortOrder), CreatedAt: row.CreatedAt.Time,
	}, nil
}

func (s *Service) UpdateArea(ctx context.Context, id uuid.UUID, req UpdateDiningAreaRequest) (*DiningAreaResponse, error) {
	sortOrder := int32(0)
	if req.SortOrder != nil {
		sortOrder = int32(*req.SortOrder)
	}
	row, err := s.repo.UpdateDiningArea(ctx, dining_repo.UpdateDiningAreaParams{
		ID: id, Name: req.Name, SortOrder: sortOrder,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	return &DiningAreaResponse{
		ID: row.ID, Name: row.Name, SortOrder: int(row.SortOrder), CreatedAt: row.CreatedAt.Time,
	}, nil
}

func (s *Service) DeleteArea(ctx context.Context, id uuid.UUID) error {
	if _, err := s.repo.GetDiningAreaByID(ctx, id); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return common.ErrNotFound
		}
		return err
	}
	active, err := s.repo.CountActiveDiningTablesInArea(ctx, id)
	if err != nil {
		return err
	}
	if active > 0 {
		return fmt.Errorf("%w: area has occupied or reserved tables", common.ErrInvalidInput)
	}
	return s.repo.DeleteDiningArea(ctx, id)
}

func (s *Service) ListAreas(ctx context.Context) ([]DiningAreaResponse, error) {
	rows, err := s.repo.ListDiningAreas(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]DiningAreaResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, DiningAreaResponse{
			ID: r.ID, Name: r.Name, SortOrder: int(r.SortOrder), CreatedAt: r.CreatedAt.Time,
		})
	}
	return out, nil
}

func (s *Service) ListTables(ctx context.Context) ([]DiningTableResponse, error) {
	rows, err := s.repo.ListDiningTables(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]DiningTableResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, DiningTableResponse{
			ID: r.ID, AreaID: r.AreaID, AreaName: r.AreaName, Name: r.Name,
			Capacity: int(r.Capacity), Status: string(r.Status), CreatedAt: r.CreatedAt.Time,
		})
	}
	return out, nil
}

func (s *Service) CreateTable(ctx context.Context, req CreateDiningTableRequest) (*DiningTableResponse, error) {
	row, err := s.repo.CreateDiningTable(ctx, dining_repo.CreateDiningTableParams{
		AreaID:   req.AreaID,
		Name:     req.Name,
		Capacity: int32(req.Capacity),
		Status:   dining_repo.DiningTableStatusAvailable,
	})
	if err != nil {
		return nil, err
	}
	return &DiningTableResponse{
		ID: row.ID, AreaID: row.AreaID, Name: row.Name, Capacity: int(row.Capacity),
		Status: string(row.Status), CreatedAt: row.CreatedAt.Time,
	}, nil
}

func (s *Service) UpdateTable(ctx context.Context, id uuid.UUID, req UpdateDiningTableRequest) (*DiningTableResponse, error) {
	if _, err := s.repo.GetDiningAreaByID(ctx, req.AreaID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("%w: area not found", common.ErrInvalidInput)
		}
		return nil, err
	}
	row, err := s.repo.UpdateDiningTable(ctx, dining_repo.UpdateDiningTableParams{
		ID: id, AreaID: req.AreaID, Name: req.Name, Capacity: int32(req.Capacity),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	return s.tableResponseFromRow(ctx, row)
}

func (s *Service) DeleteTable(ctx context.Context, id uuid.UUID) error {
	row, err := s.repo.GetDiningTableByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return common.ErrNotFound
		}
		return err
	}
	if row.Status == dining_repo.DiningTableStatusOccupied || row.Status == dining_repo.DiningTableStatusReserved {
		return fmt.Errorf("%w: table is occupied or reserved", common.ErrInvalidInput)
	}
	return s.repo.DeleteDiningTable(ctx, id)
}

func (s *Service) tableResponseFromRow(ctx context.Context, row dining_repo.DiningTable) (*DiningTableResponse, error) {
	areaName := ""
	if area, aErr := s.repo.GetDiningAreaByID(ctx, row.AreaID); aErr == nil {
		areaName = area.Name
	}
	return &DiningTableResponse{
		ID: row.ID, AreaID: row.AreaID, AreaName: areaName, Name: row.Name,
		Capacity: int(row.Capacity), Status: string(row.Status), CreatedAt: row.CreatedAt.Time,
	}, nil
}

func (s *Service) UpdateTableStatus(ctx context.Context, id uuid.UUID, req UpdateTableStatusRequest) (*DiningTableResponse, error) {
	status := dining_repo.DiningTableStatus(req.Status)
	row, err := s.repo.UpdateDiningTableStatus(ctx, dining_repo.UpdateDiningTableStatusParams{
		ID: id, Status: status,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	return s.tableResponseFromRow(ctx, row)
}