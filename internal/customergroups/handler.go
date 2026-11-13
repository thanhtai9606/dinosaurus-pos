package customergroups

import (
	"errors"

	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/pkg/logger"
	"dinosaurus-pos/pkg/validator"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type ICustomerGroupHandler interface {
	CreateHandler(c fiber.Ctx) error
	GetHandler(c fiber.Ctx) error
	UpdateHandler(c fiber.Ctx) error
	DeleteHandler(c fiber.Ctx) error
	ListHandler(c fiber.Ctx) error
}

type Handler struct {
	service ICustomerGroupService
	log     logger.ILogger
}

func NewHandler(service ICustomerGroupService, log logger.ILogger) ICustomerGroupHandler {
	return &Handler{service: service, log: log}
}

// @Summary      List customer groups
// @Tags         CustomerGroups
// @x-roles      ["admin", "manager", "cashier"]
// @Router       /customer-groups [get]
func (h *Handler) ListHandler(c fiber.Ctx) error {
	var req ListCustomerGroupsRequest
	if err := c.Bind().Query(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid query parameters"})
	}
	resp, err := h.service.List(c.RequestCtx(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to list customer groups"})
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: resp})
}

// @Summary      Create customer group
// @Tags         CustomerGroups
// @x-roles      ["admin", "manager"]
// @Router       /customer-groups [post]
func (h *Handler) CreateHandler(c fiber.Ctx) error {
	var req CreateCustomerGroupRequest
	if err := c.Bind().Body(&req); err != nil {
		var ve *validator.ValidationErrors
		if errors.As(err, &ve) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Validation failed", Error: ve.Error()})
		}
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid request body"})
	}
	resp, err := h.service.Create(c.RequestCtx(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to create customer group"})
	}
	return c.Status(fiber.StatusCreated).JSON(common.SuccessResponse{Message: "Customer group created", Data: resp})
}

// @Summary      Get customer group
// @Tags         CustomerGroups
// @x-roles      ["admin", "manager", "cashier"]
// @Router       /customer-groups/{id} [get]
func (h *Handler) GetHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}
	resp, err := h.service.Get(c.RequestCtx(), id)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Customer group not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to fetch customer group"})
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: resp})
}

// @Summary      Update customer group
// @Tags         CustomerGroups
// @x-roles      ["admin", "manager"]
// @Router       /customer-groups/{id} [put]
func (h *Handler) UpdateHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}
	var req UpdateCustomerGroupRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid request body"})
	}
	resp, err := h.service.Update(c.RequestCtx(), id, req)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Customer group not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to update customer group"})
	}
	return c.JSON(common.SuccessResponse{Message: "Customer group updated", Data: resp})
}

// @Summary      Delete customer group
// @Tags         CustomerGroups
// @x-roles      ["admin", "manager"]
// @Router       /customer-groups/{id} [delete]
func (h *Handler) DeleteHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}
	if err := h.service.Delete(c.RequestCtx(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to delete customer group"})
	}
	return c.JSON(common.SuccessResponse{Message: "Customer group deleted"})
}
