package customers

import (
	"dinosaurus-pos/internal/common/pagination"
	"time"

	"github.com/google/uuid"
)

type CreateCustomerRequest struct {
	Name             string     `json:"name" validate:"required,max=100"`
	Phone            *string    `json:"phone" validate:"omitempty,max=20"`
	Email            *string    `json:"email" validate:"omitempty,email,max=255"`
	Address          *string    `json:"address" validate:"omitempty"`
	CustomerGroupID  *uuid.UUID `json:"customer_group_id" validate:"omitempty"`
}

type UpdateCustomerRequest struct {
	Name            string     `json:"name" validate:"required,max=100"`
	Phone           *string    `json:"phone" validate:"omitempty,max=20"`
	Email           *string    `json:"email" validate:"omitempty,email,max=255"`
	Address         *string    `json:"address" validate:"omitempty"`
	CustomerGroupID *uuid.UUID `json:"customer_group_id" validate:"omitempty"`
}

type ListCustomersRequest struct {
	pagination.PaginationRequest
	Search  string `query:"search"`
	GroupID string `query:"group_id"`
}

type CustomerResponse struct {
	ID                uuid.UUID  `json:"id"`
	Code              string     `json:"code"`
	Name              string     `json:"name"`
	Phone             *string    `json:"phone,omitempty"`
	Email             *string    `json:"email,omitempty"`
	Address           *string    `json:"address,omitempty"`
	CustomerGroupID   *uuid.UUID `json:"customer_group_id,omitempty"`
	CustomerGroupName *string    `json:"customer_group_name,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

type PagedCustomerResponse struct {
	Customers  []CustomerResponse    `json:"customers"`
	Pagination pagination.Pagination `json:"pagination"`
}
