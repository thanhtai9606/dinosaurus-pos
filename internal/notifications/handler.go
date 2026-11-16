package notifications

import (
	"errors"
	"strconv"

	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/pkg/logger"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type IHandler interface {
	ListEventTypesHandler(c fiber.Ctx) error
	ListChannelsHandler(c fiber.Ctx) error
	CreateChannelHandler(c fiber.Ctx) error
	UpdateChannelHandler(c fiber.Ctx) error
	DeleteChannelHandler(c fiber.Ctx) error
	TestChannelHandler(c fiber.Ctx) error
	GetMySubscriptionsHandler(c fiber.Ctx) error
	UpdateMySubscriptionsHandler(c fiber.Ctx) error
	ListDeliveriesHandler(c fiber.Ctx) error
	GetTenantConfigHandler(c fiber.Ctx) error
	UpdateTenantConfigHandler(c fiber.Ctx) error
	RegisterDeviceHandler(c fiber.Ctx) error
	UnregisterDeviceHandler(c fiber.Ctx) error
	TestReportEmailHandler(c fiber.Ctx) error
}

type Handler struct {
	service INotificationService
	log     logger.ILogger
}

func NewHandler(service INotificationService, log logger.ILogger) IHandler {
	return &Handler{service: service, log: log}
}

func userIDFromCtx(c fiber.Ctx) (uuid.UUID, error) {
	v := c.Locals("user_id")
	id, ok := v.(uuid.UUID)
	if !ok || id == uuid.Nil {
		return uuid.Nil, errors.New("missing user")
	}
	return id, nil
}

func actorEmailFromCtx(c fiber.Ctx) string {
	if e, ok := c.Locals("email").(string); ok {
		return e
	}
	return ""
}

// ListEventTypesHandler
// @Summary      List notification event types
// @Tags         Notifications
// @Produce      json
// @Success      200 {object} common.SuccessResponse
// @x-roles      ["admin", "manager", "cashier"]
// @Router       /notification-event-types [get]
func (h *Handler) ListEventTypesHandler(c fiber.Ctx) error {
	data, err := h.service.ListEventTypes(c.RequestCtx())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to list event types"})
	}
	return c.JSON(common.SuccessResponse{Message: "OK", Data: data})
}

// ListChannelsHandler
// @Summary      List notification channels
// @Tags         Notifications
// @Produce      json
// @Success      200 {object} common.SuccessResponse
// @x-roles      ["admin", "manager"]
// @Router       /notification-channels [get]
func (h *Handler) ListChannelsHandler(c fiber.Ctx) error {
	data, err := h.service.ListChannels(c.RequestCtx())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to list channels"})
	}
	return c.JSON(common.SuccessResponse{Message: "OK", Data: data})
}

// CreateChannelHandler
// @Summary      Create notification channel
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        body body CreateChannelRequest true "channel"
// @Success      201 {object} common.SuccessResponse
// @x-roles      ["admin"]
// @Router       /notification-channels [post]
func (h *Handler) CreateChannelHandler(c fiber.Ctx) error {
	var req CreateChannelRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid body"})
	}
	data, err := h.service.CreateChannel(c.RequestCtx(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to create channel"})
	}
	return c.Status(fiber.StatusCreated).JSON(common.SuccessResponse{Message: "Created", Data: data})
}

// UpdateChannelHandler
// @Summary      Update notification channel
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        id path string true "channel ID"
// @Param        body body UpdateChannelRequest true "channel"
// @Success      200 {object} common.SuccessResponse
// @x-roles      ["admin"]
// @Router       /notification-channels/{id} [put]
func (h *Handler) UpdateChannelHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid id"})
	}
	var req UpdateChannelRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid body"})
	}
	data, err := h.service.UpdateChannel(c.RequestCtx(), id, req)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to update channel"})
	}
	return c.JSON(common.SuccessResponse{Message: "OK", Data: data})
}

// DeleteChannelHandler
// @Summary      Delete notification channel
// @Tags         Notifications
// @Param        id path string true "channel ID"
// @Success      200 {object} common.SuccessResponse
// @x-roles      ["admin"]
// @Router       /notification-channels/{id} [delete]
func (h *Handler) DeleteChannelHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid id"})
	}
	if err := h.service.DeleteChannel(c.RequestCtx(), id); err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to delete channel"})
	}
	return c.JSON(common.SuccessResponse{Message: "Deleted"})
}

// TestChannelHandler
// @Summary      Send test notification
// @Tags         Notifications
// @Param        id path string true "channel ID"
// @Success      200 {object} common.SuccessResponse
// @x-roles      ["admin"]
// @Router       /notification-channels/{id}/test [post]
func (h *Handler) TestChannelHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid id"})
	}
	uid, _ := userIDFromCtx(c)
	if err := h.service.TestChannel(c.RequestCtx(), id, actorEmailFromCtx(c), uid); err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Not found"})
		}
		if errors.Is(err, common.ErrBadRequest) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: err.Error()})
		}
		return c.Status(fiber.StatusBadGateway).JSON(common.ErrorResponse{Message: "Test send failed", Error: err.Error()})
	}
	return c.JSON(common.SuccessResponse{Message: "Test sent"})
}

// GetMySubscriptionsHandler
// @Summary      My notification subscriptions
// @Tags         Notifications
// @Success      200 {object} common.SuccessResponse
// @x-roles      ["admin", "manager", "cashier"]
// @Router       /notification-subscriptions/me [get]
func (h *Handler) GetMySubscriptionsHandler(c fiber.Ctx) error {
	uid, err := userIDFromCtx(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(common.ErrorResponse{Message: "Unauthorized"})
	}
	data, err := h.service.GetMySubscriptions(c.RequestCtx(), uid)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to load subscriptions"})
	}
	return c.JSON(common.SuccessResponse{Message: "OK", Data: data})
}

// UpdateMySubscriptionsHandler
// @Summary      Update my notification subscriptions
// @Tags         Notifications
// @Accept       json
// @Param        body body UpdateSubscriptionsRequest true "items"
// @Success      200 {object} common.SuccessResponse
// @x-roles      ["admin", "manager", "cashier"]
// @Router       /notification-subscriptions/me [put]
func (h *Handler) UpdateMySubscriptionsHandler(c fiber.Ctx) error {
	uid, err := userIDFromCtx(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(common.ErrorResponse{Message: "Unauthorized"})
	}
	var req UpdateSubscriptionsRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid body"})
	}
	data, err := h.service.UpdateMySubscriptions(c.RequestCtx(), uid, req)
	if err != nil {
		if errors.Is(err, common.ErrBadRequest) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to update subscriptions"})
	}
	return c.JSON(common.SuccessResponse{Message: "OK", Data: data})
}

// ListDeliveriesHandler
// @Summary      Notification delivery log
// @Tags         Notifications
// @Success      200 {object} common.SuccessResponse
// @x-roles      ["admin"]
// @Router       /notification-deliveries [get]
func (h *Handler) ListDeliveriesHandler(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	data, err := h.service.ListDeliveries(c.RequestCtx(), page, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to list deliveries"})
	}
	return c.JSON(common.SuccessResponse{Message: "OK", Data: data})
}

// GetTenantConfigHandler
// @Summary      Notification tenant settings
// @Tags         Notifications
// @Success      200 {object} common.SuccessResponse
// @x-roles      ["admin"]
// @Router       /notifications/config [get]
func (h *Handler) GetTenantConfigHandler(c fiber.Ctx) error {
	data, err := h.service.GetTenantConfig(c.RequestCtx())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to load config"})
	}
	return c.JSON(common.SuccessResponse{Message: "OK", Data: data})
}

// UpdateTenantConfigHandler
// @Summary      Update notification tenant settings
// @Tags         Notifications
// @Accept       json
// @Param        body body UpdateTenantConfigRequest true "config"
// @Success      200 {object} common.SuccessResponse
// @x-roles      ["admin"]
// @Router       /notifications/config [put]
func (h *Handler) UpdateTenantConfigHandler(c fiber.Ctx) error {
	var req UpdateTenantConfigRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid body"})
	}
	data, err := h.service.UpdateTenantConfig(c.RequestCtx(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to update config"})
	}
	return c.JSON(common.SuccessResponse{Message: "OK", Data: data})
}

type registerDeviceRequest struct {
	Token    string `json:"token"`
	Platform string `json:"platform"`
}

type unregisterDeviceRequest struct {
	Token string `json:"token"`
}

// RegisterDeviceHandler
// @Summary      Register FCM device token
// @Tags         Notifications
// @Accept       json
// @Success      200 {object} common.SuccessResponse
// @x-roles      ["admin", "manager", "cashier"]
// @Router       /notification-devices/register [post]
func (h *Handler) RegisterDeviceHandler(c fiber.Ctx) error {
	uid, err := userIDFromCtx(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(common.ErrorResponse{Message: "Unauthorized"})
	}
	var req registerDeviceRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid body"})
	}
	if err := h.service.RegisterDeviceToken(c.RequestCtx(), uid, req.Token, req.Platform); err != nil {
		if errors.Is(err, common.ErrBadRequest) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to register device"})
	}
	return c.JSON(common.SuccessResponse{Message: "Registered"})
}

// UnregisterDeviceHandler
// @Summary      Unregister FCM device token
// @Tags         Notifications
// @Accept       json
// @Success      200 {object} common.SuccessResponse
// @x-roles      ["admin", "manager", "cashier"]
// @Router       /notification-devices [delete]
func (h *Handler) UnregisterDeviceHandler(c fiber.Ctx) error {
	uid, err := userIDFromCtx(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(common.ErrorResponse{Message: "Unauthorized"})
	}
	var req unregisterDeviceRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid body"})
	}
	if err := h.service.UnregisterDeviceToken(c.RequestCtx(), uid, req.Token); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to unregister"})
	}
	return c.JSON(common.SuccessResponse{Message: "Unregistered"})
}

// TestReportEmailHandler
// @Summary      Send test scheduled report email
// @Tags         Notifications
// @Param        period query string true "daily|monthly|yearly"
// @Success      200 {object} common.SuccessResponse
// @x-roles      ["admin"]
// @Router       /notifications/reports/test [post]
func (h *Handler) TestReportEmailHandler(c fiber.Ctx) error {
	period := c.Query("period", "daily")
	if err := h.service.TestReportEmail(c.RequestCtx(), period); err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(common.ErrorResponse{Message: "Report test failed", Error: err.Error()})
	}
	return c.JSON(common.SuccessResponse{Message: "Report email sent"})
}