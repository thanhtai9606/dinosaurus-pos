package settings

import (
	"POS-kasir/internal/common"
	"POS-kasir/pkg/logger"
	"POS-kasir/pkg/validator"
	"errors"
	"io"
	"net/http"

	"github.com/gofiber/fiber/v3"
)

type SettingsHandler struct {
	service ISettingsService
	log     logger.ILogger
}

func NewSettingsHandler(service ISettingsService, log logger.ILogger) *SettingsHandler {
	return &SettingsHandler{
		service: service,
		log:     log,
	}
}

// GetBrandingHandler gets branding settings
// @Summary      Get branding settings
// @Description  Retrieve branding settings (app name, logo, footer text, theme colors) for the application (Roles: authenticated)
// @Tags         Settings
// @Accept       json
// @Produce      json
// @Success      200 {object} common.SuccessResponse{data=BrandingSettingsResponse} "Branding settings fetched successfully"
// @Failure      500 {object} common.ErrorResponse "Internal server error"
// @x-roles      ["admin", "manager", "cashier"]
// @Router       /settings/branding [get]
func (h *SettingsHandler) GetBrandingHandler(c fiber.Ctx) error {
	ctx := c.RequestCtx()

	resp, err := h.service.GetBranding(ctx)
	if err != nil {
		h.log.Errorf("Failed to fetch branding settings", "error", err)
		return c.Status(http.StatusInternalServerError).JSON(common.ErrorResponse{
			Message: "Failed to fetch branding settings",
			Error:   err.Error(),
		})
	}

	return c.Status(http.StatusOK).JSON(common.SuccessResponse{
		Message: "Branding settings fetched successfully",
		Data:    resp,
	})
}

// UpdateBrandingHandler updates branding settings
// @Summary      Update branding settings
// @Description  Update application branding settings (Roles: admin)
// @Tags         Settings
// @Accept       json
// @Produce      json
// @Param        request body UpdateBrandingRequest true "Branding update request"
// @Success      200 {object} common.SuccessResponse{data=BrandingSettingsResponse} "Branding settings updated successfully"
// @Failure      400 {object} common.ErrorResponse "Invalid request body or validation failure"
// @Failure      500 {object} common.ErrorResponse "Internal server error"
// @x-roles      ["admin"]
// @Router       /settings/branding [put]
func (h *SettingsHandler) UpdateBrandingHandler(c fiber.Ctx) error {
	ctx := c.RequestCtx()
	var req UpdateBrandingRequest

	if err := c.Bind().Body(&req); err != nil {
		h.log.Warnf("Update branding validation failed", "error", err)
		var ve *validator.ValidationErrors
		if errors.As(err, &ve) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{
				Message: "Validation failed",
				Error:   ve.Error(),
				Data: map[string]interface{}{
					"errors": ve.Errors,
				},
			})
		}
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{
			Message: "Invalid request body",
			Error:   err.Error(),
		})
	}

	resp, err := h.service.UpdateBranding(ctx, req)
	if err != nil {
		h.log.Errorf("Failed to update branding settings", "error", err)
		return c.Status(http.StatusInternalServerError).JSON(common.ErrorResponse{
			Message: "Failed to update branding settings",
			Error:   err.Error(),
		})
	}

	return c.Status(http.StatusOK).JSON(common.SuccessResponse{
		Message: "Branding settings updated successfully",
		Data:    resp,
	})
}

// UpdateLogoHandler updates the app logo
// @Summary      Update app logo
// @Description  Upload and update the application logo image (Roles: admin)
// @Tags         Settings
// @Accept       multipart/form-data
// @Produce      json
// @Param        logo formData file true "Logo image file"
// @Success      200 {object} common.SuccessResponse{data=map[string]string} "Logo updated successfully"
// @Failure      400 {object} common.ErrorResponse "Logo file is required or file size exceeds limit"
// @Failure      500 {object} common.ErrorResponse "Internal server error"
// @x-roles      ["admin"]
// @Router       /settings/branding/logo [post]
func (h *SettingsHandler) UpdateLogoHandler(c fiber.Ctx) error {
	ctx := c.RequestCtx()

	file, err := c.FormFile("logo")
	if err != nil {
		h.log.Warnf("Logo download attempt without file", "error", err)
		return c.Status(http.StatusBadRequest).JSON(common.ErrorResponse{
			Message: "Logo file is required",
			Error:   err.Error(),
		})
	}

	// Validate file size (e.g. max 5MB)
	if file.Size > 5*1024*1024 {
		h.log.Warnf("Logo file size exceeds limit", "size", file.Size)
		return c.Status(http.StatusBadRequest).JSON(common.ErrorResponse{
			Message: "File size exceeds 5MB limit",
		})
	}

	// Validate content type
	src, err := file.Open()
	if err != nil {
		h.log.Errorf("Failed to open uploaded logo file", "error", err)
		return c.Status(http.StatusBadRequest).JSON(common.ErrorResponse{
			Message: "Failed to open file",
			Error:   err.Error(),
		})
	}
	defer src.Close()

	// Read file content
	data, err := io.ReadAll(src)
	if err != nil {
		h.log.Errorf("Failed to read logo file content", "error", err)
		return c.Status(http.StatusBadRequest).JSON(common.ErrorResponse{
			Message: "Failed to read file content",
			Error:   err.Error(),
		})
	}

	contentType := file.Header.Get("Content-Type")

	url, err := h.service.UpdateLogo(ctx, data, file.Filename, contentType)
	if err != nil {
		h.log.Errorf("Failed to update logo in service", "error", err)
		return c.Status(http.StatusInternalServerError).JSON(common.ErrorResponse{
			Message: "Failed to update logo",
			Error:   err.Error(),
		})
	}

	h.log.Infof("Logo updated successfully", "filename", file.Filename, "url", url)
	return c.Status(http.StatusOK).JSON(common.SuccessResponse{
		Message: "Logo updated successfully",
		Data:    map[string]string{"url": url},
	})
}

// GetPrinterSettingsHandler gets printer settings
// @Summary      Get printer settings
// @Description  Retrieve printer settings like connection string and paper width (Roles: authenticated)
// @Tags         Settings
// @Accept       json
// @Produce      json
// @Success      200 {object} common.SuccessResponse{data=PrinterSettingsResponse} "Printer settings fetched successfully"
// @Failure      500 {object} common.ErrorResponse "Internal server error"
// @x-roles      ["admin", "manager", "cashier"]
// @Router       /settings/printer [get]
func (h *SettingsHandler) GetPrinterSettingsHandler(c fiber.Ctx) error {
	ctx := c.RequestCtx()

	resp, err := h.service.GetPrinterSettings(ctx)
	if err != nil {
		h.log.Errorf("Failed to fetch printer settings", "error", err)
		return c.Status(http.StatusInternalServerError).JSON(common.ErrorResponse{
			Message: "Failed to fetch printer settings",
			Error:   err.Error(),
		})
	}

	return c.Status(http.StatusOK).JSON(common.SuccessResponse{
		Message: "Printer settings fetched successfully",
		Data:    resp,
	})
}

// UpdatePrinterSettingsHandler updates printer settings
// @Summary      Update printer settings
// @Description  Update global printer configuration (Roles: admin)
// @Tags         Settings
// @Accept       json
// @Produce      json
// @Param        request body UpdatePrinterSettingsRequest true "Printer settings update request"
// @Success      200 {object} common.SuccessResponse{data=PrinterSettingsResponse} "Printer settings updated successfully"
// @Failure      400 {object} common.ErrorResponse "Invalid request body or validation failure"
// @Failure      500 {object} common.ErrorResponse "Internal server error"
// @x-roles      ["admin"]
// @Router       /settings/printer [put]
func (h *SettingsHandler) UpdatePrinterSettingsHandler(c fiber.Ctx) error {
	ctx := c.RequestCtx()
	var req UpdatePrinterSettingsRequest

	if err := c.Bind().Body(&req); err != nil {
		h.log.Warnf("Update printer settings validation failed", "error", err)
		var ve *validator.ValidationErrors
		if errors.As(err, &ve) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{
				Message: "Validation failed",
				Error:   ve.Error(),
				Data: map[string]interface{}{
					"errors": ve.Errors,
				},
			})
		}
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{
			Message: "Invalid request body",
			Error:   err.Error(),
		})
	}

	resp, err := h.service.UpdatePrinterSettings(ctx, req)
	if err != nil {
		h.log.Errorf("Failed to update printer settings", "error", err)
		return c.Status(http.StatusInternalServerError).JSON(common.ErrorResponse{
			Message: "Failed to update printer settings",
			Error:   err.Error(),
		})
	}

	return c.Status(http.StatusOK).JSON(common.SuccessResponse{
		Message: "Printer settings updated successfully",
		Data:    resp,
	})
}

// GetFinancialSettingsHandler returns financial configuration
// @Summary      Get financial settings
// @Description  Currency, tax rate, and service charge (Roles: authenticated)
// @Tags         Settings
// @Produce      json
// @Success      200 {object} common.SuccessResponse{data=FinancialSettingsResponse}
// @x-roles      ["admin", "manager", "cashier"]
// @Router       /settings/financial [get]
func (h *SettingsHandler) GetFinancialSettingsHandler(c fiber.Ctx) error {
	ctx := c.RequestCtx()
	resp, err := h.service.GetFinancialSettings(ctx)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(common.ErrorResponse{
			Message: "Failed to fetch financial settings",
			Error:   err.Error(),
		})
	}
	return c.Status(http.StatusOK).JSON(common.SuccessResponse{
		Message: "Financial settings fetched successfully",
		Data:    resp,
	})
}

// UpdateFinancialSettingsHandler updates financial configuration
// @Summary      Update financial settings
// @Description  Update currency, tax, and service charge (Roles: admin)
// @Tags         Settings
// @Accept       json
// @Produce      json
// @Param        request body UpdateFinancialSettingsRequest true "Financial settings"
// @Success      200 {object} common.SuccessResponse{data=FinancialSettingsResponse}
// @x-roles      ["admin"]
// @Router       /settings/financial [put]
func (h *SettingsHandler) UpdateFinancialSettingsHandler(c fiber.Ctx) error {
	ctx := c.RequestCtx()
	var req UpdateFinancialSettingsRequest
	if err := c.Bind().Body(&req); err != nil {
		var ve *validator.ValidationErrors
		if errors.As(err, &ve) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{
				Message: "Validation failed", Error: ve.Error(),
				Data: map[string]interface{}{"errors": ve.Errors},
			})
		}
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid request body", Error: err.Error()})
	}
	resp, err := h.service.UpdateFinancialSettings(ctx, req)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, common.ErrBadRequest) {
			status = http.StatusBadRequest
		}
		return c.Status(status).JSON(common.ErrorResponse{
			Message: "Failed to update financial settings", Error: err.Error(),
		})
	}
	return c.Status(http.StatusOK).JSON(common.SuccessResponse{
		Message: "Financial settings updated successfully", Data: resp,
	})
}

// UpdateSupportedCurrenciesHandler replaces the enabled currency list (stored in DB).
// @Summary      Update supported currencies
// @Description  JSON list of currencies for multi-region deployments (Roles: admin)
// @Tags         Settings
// @Accept       json
// @Produce      json
// @Param        request body UpdateSupportedCurrenciesRequest true "Currency list"
// @Success      200 {object} common.SuccessResponse{data=FinancialSettingsResponse}
// @x-roles      ["admin"]
// @Router       /settings/financial/currencies [put]
func (h *SettingsHandler) UpdateSupportedCurrenciesHandler(c fiber.Ctx) error {
	ctx := c.RequestCtx()
	var req UpdateSupportedCurrenciesRequest
	if err := c.Bind().Body(&req); err != nil {
		var ve *validator.ValidationErrors
		if errors.As(err, &ve) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{
				Message: "Validation failed", Error: ve.Error(),
				Data: map[string]interface{}{"errors": ve.Errors},
			})
		}
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid request body", Error: err.Error()})
	}
	resp, err := h.service.UpdateSupportedCurrencies(ctx, req)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, common.ErrBadRequest) {
			status = http.StatusBadRequest
		}
		return c.Status(status).JSON(common.ErrorResponse{
			Message: "Failed to update supported currencies", Error: err.Error(),
		})
	}
	return c.Status(http.StatusOK).JSON(common.SuccessResponse{
		Message: "Supported currencies updated successfully", Data: resp,
	})
}

// GetInvoiceSettingsHandler returns receipt/invoice layout settings
// @Summary      Get invoice settings
// @Description  Receipt headers, footers, and legal text (Roles: authenticated)
// @Tags         Settings
// @Produce      json
// @Success      200 {object} common.SuccessResponse{data=InvoiceSettingsResponse}
// @x-roles      ["admin", "manager", "cashier"]
// @Router       /settings/invoice [get]
func (h *SettingsHandler) GetInvoiceSettingsHandler(c fiber.Ctx) error {
	ctx := c.RequestCtx()
	resp, err := h.service.GetInvoiceSettings(ctx)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(common.ErrorResponse{
			Message: "Failed to fetch invoice settings", Error: err.Error(),
		})
	}
	return c.Status(http.StatusOK).JSON(common.SuccessResponse{
		Message: "Invoice settings fetched successfully", Data: resp,
	})
}

// UpdateInvoiceSettingsHandler updates receipt/invoice layout
// @Summary      Update invoice settings
// @Description  Customize printed invoices (Roles: admin)
// @Tags         Settings
// @Accept       json
// @Produce      json
// @Param        request body UpdateInvoiceSettingsRequest true "Invoice settings"
// @Success      200 {object} common.SuccessResponse{data=InvoiceSettingsResponse}
// @x-roles      ["admin"]
// @Router       /settings/invoice [put]
func (h *SettingsHandler) UpdateInvoiceSettingsHandler(c fiber.Ctx) error {
	ctx := c.RequestCtx()
	var req UpdateInvoiceSettingsRequest
	if err := c.Bind().Body(&req); err != nil {
		var ve *validator.ValidationErrors
		if errors.As(err, &ve) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{
				Message: "Validation failed", Error: ve.Error(),
				Data: map[string]interface{}{"errors": ve.Errors},
			})
		}
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid request body", Error: err.Error()})
	}
	resp, err := h.service.UpdateInvoiceSettings(ctx, req)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(common.ErrorResponse{
			Message: "Failed to update invoice settings", Error: err.Error(),
		})
	}
	return c.Status(http.StatusOK).JSON(common.SuccessResponse{
		Message: "Invoice settings updated successfully", Data: resp,
	})
}

// fiber:context-methods migrated
