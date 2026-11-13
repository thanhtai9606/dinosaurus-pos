package platform

import (
	"strconv"

	"POS-kasir/internal/common"
	"POS-kasir/pkg/logger"

	"github.com/gofiber/fiber/v3"
)

type Handler struct {
	svc *Service
	log logger.ILogger
}

func NewHandler(svc *Service, log logger.ILogger) *Handler {
	return &Handler{svc: svc, log: log}
}

func (h *Handler) Overview(c fiber.Ctx) error {
	data, err := h.svc.Overview(c.RequestCtx())
	if err != nil {
		h.log.Errorf("platform overview: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "failed to load overview"})
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: ToOverviewDTO(data)})
}

func (h *Handler) Memberships(c fiber.Ctx) error {
	rows, err := h.svc.Memberships(c.RequestCtx())
	if err != nil {
		h.log.Errorf("platform memberships: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "failed to list memberships"})
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: MembershipDTOs(rows)})
}

func (h *Handler) Audits(c fiber.Ctx) error {
	limit := 50
	if q := c.Query("limit"); q != "" {
		if n, err := strconv.Atoi(q); err == nil {
			limit = n
		}
	}
	rows, err := h.svc.Audits(c.RequestCtx(), limit)
	if err != nil {
		h.log.Errorf("platform audits: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "failed to list audit logs"})
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: AuditDTOs(rows)})
}
