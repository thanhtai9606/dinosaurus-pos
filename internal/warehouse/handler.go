package warehouse

import (
	"errors"

	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/pkg/logger"
	"dinosaurus-pos/pkg/validator"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type IHandler interface {
	ListHandler(c fiber.Ctx) error
	CreateHandler(c fiber.Ctx) error
	GetHandler(c fiber.Ctx) error
	UpdateHandler(c fiber.Ctx) error
	DeleteHandler(c fiber.Ctx) error
	ListStockHandler(c fiber.Ctx) error
}

type Handler struct {
	service IService
	log     logger.ILogger
}

func NewHandler(service IService, log logger.ILogger) IHandler {
	return &Handler{service: service, log: log}
}

// @Summary      List warehouses
// @Tags         Warehouses
// @x-roles      ["admin", "manager", "cashier"]
// @Router       /warehouses [get]
func (h *Handler) ListHandler(c fiber.Ctx) error {
	var req ListWarehousesRequest
	if err := c.Bind().Query(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid query parameters"})
	}
	resp, err := h.service.List(c.RequestCtx(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to list warehouses"})
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: resp})
}

// @Summary      Create warehouse
// @Tags         Warehouses
// @x-roles      ["admin", "manager"]
// @Router       /warehouses [post]
func (h *Handler) CreateHandler(c fiber.Ctx) error {
	var req CreateWarehouseRequest
	if err := c.Bind().Body(&req); err != nil {
		var ve *validator.ValidationErrors
		if errors.As(err, &ve) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Validation failed", Error: ve.Error()})
		}
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid request body"})
	}
	resp, err := h.service.Create(c.RequestCtx(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to create warehouse"})
	}
	return c.Status(fiber.StatusCreated).JSON(common.SuccessResponse{Message: "Warehouse created", Data: resp})
}

// @Summary      Get warehouse
// @Tags         Warehouses
// @x-roles      ["admin", "manager", "cashier"]
// @Router       /warehouses/{id} [get]
func (h *Handler) GetHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}
	resp, err := h.service.Get(c.RequestCtx(), id)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Warehouse not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to get warehouse"})
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: resp})
}

// @Summary      Update warehouse
// @Tags         Warehouses
// @x-roles      ["admin", "manager"]
// @Router       /warehouses/{id} [put]
func (h *Handler) UpdateHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}
	var req UpdateWarehouseRequest
	if err := c.Bind().Body(&req); err != nil {
		var ve *validator.ValidationErrors
		if errors.As(err, &ve) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Validation failed", Error: ve.Error()})
		}
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid request body"})
	}
	resp, err := h.service.Update(c.RequestCtx(), id, req)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Warehouse not found"})
		}
		if errors.Is(err, common.ErrInvalidInput) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to update warehouse"})
	}
	return c.JSON(common.SuccessResponse{Message: "Warehouse updated", Data: resp})
}

// @Summary      Delete warehouse
// @Tags         Warehouses
// @x-roles      ["admin", "manager"]
// @Router       /warehouses/{id} [delete]
func (h *Handler) DeleteHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}
	if err := h.service.Delete(c.RequestCtx(), id); err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Warehouse not found"})
		}
		if errors.Is(err, common.ErrInvalidInput) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to delete warehouse"})
	}
	return c.JSON(common.SuccessResponse{Message: "Warehouse deleted"})
}

// @Summary      List stock by warehouse
// @Tags         Warehouses
// @x-roles      ["admin", "manager", "cashier"]
// @Router       /warehouses/{id}/stock [get]
func (h *Handler) ListStockHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}
	var req ListWarehouseStockRequest
	if err := c.Bind().Query(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid query parameters"})
	}
	resp, err := h.service.ListStock(c.RequestCtx(), id, req)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Warehouse not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to list warehouse stock"})
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: resp})
}