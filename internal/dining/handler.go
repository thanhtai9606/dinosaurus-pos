package dining

import (
	"errors"

	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/pkg/logger"
	"dinosaurus-pos/pkg/validator"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type IHandler interface {
	ListAreasHandler(c fiber.Ctx) error
	CreateAreaHandler(c fiber.Ctx) error
	ListTablesHandler(c fiber.Ctx) error
	CreateTableHandler(c fiber.Ctx) error
	UpdateTableStatusHandler(c fiber.Ctx) error
}

type Handler struct {
	service IService
	log     logger.ILogger
}

func NewHandler(service IService, log logger.ILogger) IHandler {
	return &Handler{service: service, log: log}
}

func (h *Handler) ListAreasHandler(c fiber.Ctx) error {
	data, err := h.service.ListAreas(c.RequestCtx())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to list areas"})
	}
	return c.JSON(common.SuccessResponse{Message: "OK", Data: data})
}

func (h *Handler) CreateAreaHandler(c fiber.Ctx) error {
	var req CreateDiningAreaRequest
	if err := c.Bind().Body(&req); err != nil {
		var ve *validator.ValidationErrors
		if errors.As(err, &ve) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Validation failed", Error: ve.Error()})
		}
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid body"})
	}
	data, err := h.service.CreateArea(c.RequestCtx(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to create area"})
	}
	return c.Status(fiber.StatusCreated).JSON(common.SuccessResponse{Message: "Created", Data: data})
}

func (h *Handler) ListTablesHandler(c fiber.Ctx) error {
	data, err := h.service.ListTables(c.RequestCtx())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to list tables"})
	}
	return c.JSON(common.SuccessResponse{Message: "OK", Data: data})
}

func (h *Handler) CreateTableHandler(c fiber.Ctx) error {
	var req CreateDiningTableRequest
	if err := c.Bind().Body(&req); err != nil {
		var ve *validator.ValidationErrors
		if errors.As(err, &ve) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Validation failed", Error: ve.Error()})
		}
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid body"})
	}
	data, err := h.service.CreateTable(c.RequestCtx(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to create table"})
	}
	return c.Status(fiber.StatusCreated).JSON(common.SuccessResponse{Message: "Created", Data: data})
}

func (h *Handler) UpdateTableStatusHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID"})
	}
	var req UpdateTableStatusRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid body"})
	}
	data, err := h.service.UpdateTableStatus(c.RequestCtx(), id, req)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to update table"})
	}
	return c.JSON(common.SuccessResponse{Message: "OK", Data: data})
}