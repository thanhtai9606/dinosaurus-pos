package measurementunits

import (
	"dinosaurus-pos/internal/common/pagination"
	"time"

	"github.com/google/uuid"
)

type CreateMeasurementUnitRequest struct {
	Code string `json:"code" validate:"required,min=1,max=20"`
	Name string `json:"name" validate:"required,min=1,max=100"`
}

type UpdateMeasurementUnitRequest struct {
	Code string `json:"code" validate:"required,min=1,max=20"`
	Name string `json:"name" validate:"required,min=1,max=100"`
}

type ListMeasurementUnitsRequest struct {
	pagination.PaginationRequest
	Search string `query:"search"`
}

type MeasurementUnitResponse struct {
	ID        uuid.UUID `json:"id"`
	Code      string    `json:"code"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type PagedMeasurementUnitsResponse struct {
	Units      []MeasurementUnitResponse `json:"units"`
	Pagination pagination.Pagination   `json:"pagination"`
}
