package dining

import (
	"time"

	"github.com/google/uuid"
)

type DiningAreaResponse struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	SortOrder int       `json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
}

type DiningTableResponse struct {
	ID        uuid.UUID `json:"id"`
	AreaID    uuid.UUID `json:"area_id"`
	AreaName  string    `json:"area_name,omitempty"`
	Name      string    `json:"name"`
	Capacity  int       `json:"capacity"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateDiningTableRequest struct {
	AreaID   uuid.UUID `json:"area_id" validate:"required"`
	Name     string    `json:"name" validate:"required,min=1,max=60"`
	Capacity int       `json:"capacity" validate:"required,min=1,max=99"`
}

type UpdateTableStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=available occupied reserved dirty"`
}