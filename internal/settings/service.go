package settings

import (
	"POS-kasir/internal/activitylog"
	activitylog_repo "POS-kasir/internal/activitylog/repository"
	"POS-kasir/internal/common"
	"POS-kasir/internal/common/store"
	"POS-kasir/internal/settings/repository"
	cloudflarer2 "POS-kasir/pkg/cloudflare-r2"
	"POS-kasir/pkg/logger"
	"context"
	"fmt"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type ISettingsService interface {
	GetBranding(ctx context.Context) (*BrandingSettingsResponse, error)
	UpdateBranding(ctx context.Context, req UpdateBrandingRequest) (*BrandingSettingsResponse, error)
	GetPrinterSettings(ctx context.Context) (*PrinterSettingsResponse, error)
	UpdatePrinterSettings(ctx context.Context, req UpdatePrinterSettingsRequest) (*PrinterSettingsResponse, error)
	GetFinancialSettings(ctx context.Context) (*FinancialSettingsResponse, error)
	UpdateFinancialSettings(ctx context.Context, req UpdateFinancialSettingsRequest) (*FinancialSettingsResponse, error)
	GetInvoiceSettings(ctx context.Context) (*InvoiceSettingsResponse, error)
	UpdateInvoiceSettings(ctx context.Context, req UpdateInvoiceSettingsRequest) (*InvoiceSettingsResponse, error)
	ComputeOrderTaxAndService(ctx context.Context, grossTotal int64) (taxAmount int64, serviceChargeAmount int64, err error)
	UpdateLogo(ctx context.Context, data []byte, filename string, contentType string) (string, error)
}

type SettingsService struct {
	activitylog activitylog.IActivityService
	repo        repository.Querier
	store       store.Store
	r2Client    cloudflarer2.IR2
	log         logger.ILogger
}

func NewSettingsService(store store.Store, activitylog activitylog.IActivityService, repo repository.Querier, r2Client cloudflarer2.IR2, log logger.ILogger) ISettingsService {
	return &SettingsService{
		activitylog: activitylog,
		repo:        repo,
		store:       store,
		r2Client:    r2Client,
		log:         log,
	}
}

func (s *SettingsService) GetBranding(ctx context.Context) (*BrandingSettingsResponse, error) {
	settings, err := s.repo.GetSettings(ctx)
	if err != nil {
		s.log.Error("Failed to fetch settings", "error", err)
		return nil, err
	}

	response := &BrandingSettingsResponse{
		AppName:    "POS Kasir",
		FooterText: "© 2024 POS Kasir. All rights reserved.",
	}

	for _, setting := range settings {
		switch setting.Key {
		case "app_name":
			response.AppName = setting.Value
		case "app_logo":
			response.AppLogo = setting.Value
		case "footer_text":
			response.FooterText = setting.Value
		}
	}

	return response, nil
}

func (s *SettingsService) UpdateBranding(ctx context.Context, req UpdateBrandingRequest) (*BrandingSettingsResponse, error) {
	txErr := s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		qtx := repository.New(tx)
		// Update App Name
		if req.AppName != "" {
			_, err := qtx.UpsertSetting(ctx, repository.UpsertSettingParams{
				Key:   "app_name",
				Value: req.AppName,
			})
			if err != nil {
				return err
			}
		}

		// Update App Logo (URL) if provided directly (e.g. cleared)
		// Usually handled by UpdateLogo but user might want to set external URL
		if req.AppLogo != "" {
			_, err := qtx.UpsertSetting(ctx, repository.UpsertSettingParams{
				Key:   "app_logo",
				Value: req.AppLogo,
			})
			if err != nil {
				return err
			}
		}

		// Update Footer Text
		if req.FooterText != "" {
			_, err := qtx.UpsertSetting(ctx, repository.UpsertSettingParams{
				Key:   "footer_text",
				Value: req.FooterText,
			})
			if err != nil {
				return err
			}
		}

		return nil
	})

	if txErr != nil {
		s.log.Error("Failed to update branding settings", "error", txErr)
		return nil, txErr
	}

	// Activity Log
	actorID, _ := ctx.Value(common.UserIDKey).(uuid.UUID)
	logDetails := map[string]interface{}{
		"app_name":    req.AppName,
		"app_logo":    req.AppLogo,
		"footer_text": req.FooterText,
	}

	s.activitylog.Log(
		ctx,
		actorID,
		activitylog_repo.LogActionTypeUPDATE,
		activitylog_repo.LogEntityTypeSETTINGS,
		"settings",
		logDetails,
	)

	return s.GetBranding(ctx)
}

func (s *SettingsService) UpdateLogo(ctx context.Context, data []byte, filename string, contentType string) (string, error) {
	if len(data) == 0 {
		return "", common.ErrBadRequest
	}

	if s.r2Client == nil {
		s.log.Errorf("UpdateLogo | R2 storage is not initialized")
		return "", common.ErrInternal
	}

	// Generate unique filename
	ext := filepath.Ext(filename)
	newFilename := fmt.Sprintf("branding/logo_%s%s", uuid.New().String(), ext)

	// Upload to R2
	url, err := s.r2Client.UploadFile(ctx, newFilename, data, contentType)
	if err != nil {
		s.log.Error("Failed to upload logo to R2", "error", err)
		return "", err
	}

	// Update setting
	_, err = s.repo.UpsertSetting(ctx, repository.UpsertSettingParams{
		Key:   "app_logo",
		Value: url,
	})
	if err != nil {
		s.log.Error("Failed to update app_logo setting", "error", err)
		return "", err
	}

	// Activity Log
	actorID, _ := ctx.Value(common.UserIDKey).(uuid.UUID)
	s.activitylog.Log(
		ctx,
		actorID,
		activitylog_repo.LogActionTypeUPDATE,
		activitylog_repo.LogEntityTypeSETTINGS,
		"settings",
		map[string]interface{}{"app_logo": url},
	)

	return url, nil
}

func (s *SettingsService) GetPrinterSettings(ctx context.Context) (*PrinterSettingsResponse, error) {
	settings, err := s.repo.GetSettings(ctx)
	if err != nil {
		s.log.Error("Failed to fetch settings", "error", err)
		return nil, err
	}

	response := &PrinterSettingsResponse{
		Connection:  "socket://127.0.0.1:9100",
		PaperWidth:  "58mm",
		AutoPrint:   false,
		PrintMethod: "BE",
	}

	for _, setting := range settings {
		switch setting.Key {
		case "printer_connection":
			response.Connection = setting.Value
		case "printer_paper_width":
			response.PaperWidth = setting.Value
		case "printer_auto_print":
			response.AutoPrint = setting.Value == "true"
		case "printer_method":
			response.PrintMethod = setting.Value
		}
	}

	return response, nil
}

func (s *SettingsService) UpdatePrinterSettings(ctx context.Context, req UpdatePrinterSettingsRequest) (*PrinterSettingsResponse, error) {
	txErr := s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		qtx := repository.New(tx)
		// Connection
		if req.Connection != "" {
			_, err := qtx.UpsertSetting(ctx, repository.UpsertSettingParams{
				Key:   "printer_connection",
				Value: req.Connection,
			})
			if err != nil {
				return err
			}
		}

		// Paper Width
		if req.PaperWidth != "" {
			_, err := qtx.UpsertSetting(ctx, repository.UpsertSettingParams{
				Key:   "printer_paper_width",
				Value: req.PaperWidth,
			})
			if err != nil {
				return err
			}
		}

		// Auto Print
		if req.AutoPrint != nil {
			val := "false"
			if *req.AutoPrint {
				val = "true"
			}
			_, err := qtx.UpsertSetting(ctx, repository.UpsertSettingParams{
				Key:   "printer_auto_print",
				Value: val,
			})
			if err != nil {
				return err
			}
		}

		// Print Method
		if req.PrintMethod != "" {
			_, err := qtx.UpsertSetting(ctx, repository.UpsertSettingParams{
				Key:   "printer_method",
				Value: req.PrintMethod,
			})
			if err != nil {
				return err
			}
		}

		return nil
	})

	if txErr != nil {
		s.log.Error("Failed to update printer settings", "error", txErr)
		return nil, txErr
	}

	// Activity Log
	actorID, _ := ctx.Value(common.UserIDKey).(uuid.UUID)
	s.activitylog.Log(
		ctx,
		actorID,
		activitylog_repo.LogActionTypeUPDATE,
		activitylog_repo.LogEntityTypeSETTINGS,
		"settings",
		map[string]interface{}{"printer_connection": req.Connection, "printer_paper_width": req.PaperWidth, "printer_auto_print": req.AutoPrint, "printer_method": req.PrintMethod},
	)

	return s.GetPrinterSettings(ctx)
}

func settingsMap(ctx context.Context, repo repository.Querier) (map[string]string, error) {
	list, err := repo.GetSettings(ctx)
	if err != nil {
		return nil, err
	}
	m := make(map[string]string, len(list))
	for _, s := range list {
		m[s.Key] = s.Value
	}
	return m, nil
}

func parseBoolSetting(val string, defaultVal bool) bool {
	if val == "" {
		return defaultVal
	}
	v, err := strconv.ParseBool(strings.ToLower(val))
	if err != nil {
		return defaultVal
	}
	return v
}

func parseFloatSetting(val string, defaultVal float64) float64 {
	if val == "" {
		return defaultVal
	}
	v, err := strconv.ParseFloat(val, 64)
	if err != nil {
		return defaultVal
	}
	return v
}

func (s *SettingsService) GetFinancialSettings(ctx context.Context) (*FinancialSettingsResponse, error) {
	m, err := settingsMap(ctx, s.repo)
	if err != nil {
		s.log.Error("Failed to fetch settings", "error", err)
		return nil, err
	}
	currency := m["currency"]
	if currency == "" {
		currency = "IDR"
	}
	return &FinancialSettingsResponse{
		Currency:          currency,
		TaxRate:           parseFloatSetting(m["tax_rate"], 11),
		ServiceChargeRate: parseFloatSetting(m["service_charge_rate"], 0),
		TaxEnabled:        parseBoolSetting(m["tax_enabled"], true),
	}, nil
}

func (s *SettingsService) UpdateFinancialSettings(ctx context.Context, req UpdateFinancialSettingsRequest) (*FinancialSettingsResponse, error) {
	taxEnabled := "false"
	if req.TaxEnabled != nil && *req.TaxEnabled {
		taxEnabled = "true"
	}
	txErr := s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		qtx := repository.New(tx)
		upserts := map[string]string{
			"currency":              req.Currency,
			"tax_rate":              fmt.Sprintf("%.2f", req.TaxRate),
			"service_charge_rate": fmt.Sprintf("%.2f", req.ServiceChargeRate),
			"tax_enabled":           taxEnabled,
		}
		for key, val := range upserts {
			if _, err := qtx.UpsertSetting(ctx, repository.UpsertSettingParams{Key: key, Value: val}); err != nil {
				return err
			}
		}
		return nil
	})
	if txErr != nil {
		s.log.Error("Failed to update financial settings", "error", txErr)
		return nil, txErr
	}

	actorID, _ := ctx.Value(common.UserIDKey).(uuid.UUID)
	s.activitylog.Log(ctx, actorID, activitylog_repo.LogActionTypeUPDATE, activitylog_repo.LogEntityTypeSETTINGS, "settings", map[string]interface{}{
		"currency": req.Currency, "tax_rate": req.TaxRate, "service_charge_rate": req.ServiceChargeRate,
	})

	return s.GetFinancialSettings(ctx)
}

func (s *SettingsService) GetInvoiceSettings(ctx context.Context) (*InvoiceSettingsResponse, error) {
	m, err := settingsMap(ctx, s.repo)
	if err != nil {
		return nil, err
	}
	prefix := m["invoice_prefix"]
	if prefix == "" {
		prefix = "INV"
	}
	return &InvoiceSettingsResponse{
		ReceiptHeader:    m["receipt_header"],
		ReceiptFooter:    m["receipt_footer"],
		InvoicePrefix:    prefix,
		ShowTaxOnReceipt: parseBoolSetting(m["show_tax_on_receipt"], true),
		LegalText:        m["invoice_legal_text"],
	}, nil
}

func (s *SettingsService) UpdateInvoiceSettings(ctx context.Context, req UpdateInvoiceSettingsRequest) (*InvoiceSettingsResponse, error) {
	showTax := "false"
	if req.ShowTaxOnReceipt != nil && *req.ShowTaxOnReceipt {
		showTax = "true"
	}
	txErr := s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		qtx := repository.New(tx)
		upserts := map[string]string{
			"receipt_header":      req.ReceiptHeader,
			"receipt_footer":      req.ReceiptFooter,
			"invoice_prefix":      req.InvoicePrefix,
			"show_tax_on_receipt": showTax,
			"invoice_legal_text":  req.LegalText,
		}
		for key, val := range upserts {
			if _, err := qtx.UpsertSetting(ctx, repository.UpsertSettingParams{Key: key, Value: val}); err != nil {
				return err
			}
		}
		return nil
	})
	if txErr != nil {
		s.log.Error("Failed to update invoice settings", "error", txErr)
		return nil, txErr
	}

	actorID, _ := ctx.Value(common.UserIDKey).(uuid.UUID)
	s.activitylog.Log(ctx, actorID, activitylog_repo.LogActionTypeUPDATE, activitylog_repo.LogEntityTypeSETTINGS, "settings", map[string]interface{}{
		"invoice_prefix": req.InvoicePrefix,
	})

	return s.GetInvoiceSettings(ctx)
}

func (s *SettingsService) ComputeOrderTaxAndService(ctx context.Context, grossTotal int64) (int64, int64, error) {
	fin, err := s.GetFinancialSettings(ctx)
	if err != nil {
		return 0, 0, err
	}
	var tax int64
	if fin.TaxEnabled && fin.TaxRate > 0 {
		tax = int64(float64(grossTotal) * fin.TaxRate / 100)
	}
	service := int64(0)
	if fin.ServiceChargeRate > 0 {
		service = int64(float64(grossTotal) * fin.ServiceChargeRate / 100)
	}
	return tax, service, nil
}
