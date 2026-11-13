package customergroups

import (
	"dinosaurus-pos/internal/common/pagination"
	"time"

	"github.com/google/uuid"
)

type CreateCustomerGroupRequest struct {
	Code        string  `json:"code" validate:"required,max=50"`
	Name        string  `json:"name" validate:"required,max=100"`
	Description *string `json:"description" validate:"omitempty,max=500"`
}

type UpdateCustomerGroupRequest struct {
	Code        string  `json:"code" validate:"required,max=50"`
	Name        string  `json:"name" validate:"required,max=100"`
	Description *string `json:"description" validate:"omitempty,max=500"`
}

type ListCustomerGroupsRequest struct {
	pagination.PaginationRequest
	Search string `query:"search"`
}

type CustomerGroupResponse struct {
	ID          uuid.UUID `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type PagedCustomerGroupResponse struct {
	Groups     []CustomerGroupResponse `json:"groups"`
	Pagination pagination.Pagination   `json:"pagination"`
}
