package repository

import (
	"context"

	"github.com/google/uuid"
)

type Querier interface {
	CountMeasurementUnits(ctx context.Context, search *string) (int64, error)
	CountProductsUsingMeasurementUnit(ctx context.Context, arg CountProductsUsingMeasurementUnitParams) (int64, error)
	CreateMeasurementUnit(ctx context.Context, arg CreateMeasurementUnitParams) (MeasurementUnit, error)
	DeleteMeasurementUnit(ctx context.Context, id uuid.UUID) error
	GetMeasurementUnitByID(ctx context.Context, id uuid.UUID) (MeasurementUnit, error)
	InsertMeasurementUnitIfMissing(ctx context.Context, arg InsertMeasurementUnitIfMissingParams) error
	ListMeasurementUnits(ctx context.Context, arg ListMeasurementUnitsParams) ([]MeasurementUnit, error)
	UpdateMeasurementUnit(ctx context.Context, arg UpdateMeasurementUnitParams) (MeasurementUnit, error)
}

var _ Querier = (*Queries)(nil)
