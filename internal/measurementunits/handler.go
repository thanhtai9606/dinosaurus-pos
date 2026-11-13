package measurementunits

import (
	"errors"

	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/pkg/logger"
	"dinosaurus-pos/pkg/validator"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type IHandler interface {
	CreateHandler(c fiber.Ctx) error
	GetHandler(c fiber.Ctx) error
	UpdateHandler(c fiber.Ctx) error
	DeleteHandler(c fiber.Ctx) error
	ListHandler(c fiber.Ctx) error
}

type Handler struct {
	service IService
	log     logger.ILogger
}

func NewHandler(service IService, log logger.ILogger) IHandler {
	return &Handler{service: service, log: log}
}

// @Summary      List measurement units
// @Tags         MeasurementUnits
// @x-roles      ["admin", "manager", "cashier"]
// @Router       /measurement-units [get]
func (h *Handler) ListHandler(c fiber.Ctx) error {
	var req ListMeasurementUnitsRequest
	if err := c.Bind().Query(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid query parameters"})
	}
	resp, err := h.service.List(c.RequestCtx(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to list measurement units"})
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: resp})
}

// @Summary      Create measurement unit
// @Tags         MeasurementUnits
// @x-roles      ["admin", "manager"]
// @Router       /measurement-units [post]
func (h *Handler) CreateHandler(c fiber.Ctx) error {
	var req CreateMeasurementUnitRequest
	if err := c.Bind().Body(&req); err != nil {
		var ve *validator.ValidationErrors
		if errors.As(err, &ve) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Validation failed", Error: ve.Error()})
		}
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid request body"})
	}
	resp, err := h.service.Create(c.RequestCtx(), req)
	if err != nil {
		if errors.Is(err, ErrDuplicateCode) {
			return c.Status(fiber.StatusConflict).JSON(common.ErrorResponse{Message: "Unit code already exists"})
		}
		if errors.Is(err, ErrDuplicateName) {
			return c.Status(fiber.StatusConflict).JSON(common.ErrorResponse{Message: "Unit name already exists"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to create measurement unit"})
	}
	return c.Status(fiber.StatusCreated).JSON(common.SuccessResponse{Message: "Measurement unit created", Data: resp})
}

// @Summary      Get measurement unit
// @Tags         MeasurementUnits
// @x-roles      ["admin", "manager", "cashier"]
// @Router       /measurement-units/{id} [get]
func (h *Handler) GetHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}
	resp, err := h.service.Get(c.RequestCtx(), id)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Measurement unit not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to fetch measurement unit"})
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: resp})
}

// @Summary      Update measurement unit
// @Tags         MeasurementUnits
// @x-roles      ["admin", "manager"]
// @Router       /measurement-units/{id} [put]
func (h *Handler) UpdateHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}
	var req UpdateMeasurementUnitRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid request body"})
	}
	resp, err := h.service.Update(c.RequestCtx(), id, req)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Measurement unit not found"})
		}
		if errors.Is(err, ErrDuplicateCode) {
			return c.Status(fiber.StatusConflict).JSON(common.ErrorResponse{Message: "Unit code already exists"})
		}
		if errors.Is(err, ErrDuplicateName) {
			return c.Status(fiber.StatusConflict).JSON(common.ErrorResponse{Message: "Unit name already exists"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to update measurement unit"})
	}
	return c.JSON(common.SuccessResponse{Message: "Measurement unit updated", Data: resp})
}

// @Summary      Delete measurement unit
// @Tags         MeasurementUnits
// @x-roles      ["admin", "manager"]
// @Router       /measurement-units/{id} [delete]
func (h *Handler) DeleteHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}
	if err := h.service.Delete(c.RequestCtx(), id); err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Measurement unit not found"})
		}
		if errors.Is(err, ErrInUse) {
			return c.Status(fiber.StatusConflict).JSON(common.ErrorResponse{Message: "Unit is in use by products"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to delete measurement unit"})
	}
	return c.JSON(common.SuccessResponse{Message: "Measurement unit deleted"})
}
