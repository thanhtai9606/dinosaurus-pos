package settings

import "time"

type SettingResponse struct {
	Key         string    `json:"key"`
	Value       string    `json:"value"`
	Description *string   `json:"description,omitempty"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type UpdateSettingRequest struct {
	Value string `json:"value" validate:"required"`
}

type BrandingSettingsResponse struct {
	AppName    string `json:"app_name"`
	AppLogo    string `json:"app_logo"`
	FooterText string `json:"footer_text"`
}

type UpdateBrandingRequest struct {
	AppName    string `json:"app_name" validate:"required,min=3,max=100"`
	AppLogo    string `json:"app_logo" validate:"omitempty"`
	FooterText string `json:"footer_text" validate:"omitempty,max=200"`
}

type PrinterSettingsResponse struct {
	Connection  string `json:"connection"`
	PaperWidth  string `json:"paper_width"`
	AutoPrint   bool   `json:"auto_print"`
	PrintMethod string `json:"print_method"`
}

type UpdatePrinterSettingsRequest struct {
	Connection  string `json:"connection" validate:"required"`
	PaperWidth  string `json:"paper_width" validate:"required,oneof=58mm 80mm"`
	AutoPrint   *bool  `json:"auto_print" validate:"required"`
	PrintMethod string `json:"print_method" validate:"required,oneof=BE FE"`
}

type FinancialSettingsResponse struct {
	Currency              string           `json:"currency"`
	TaxRate               float64          `json:"tax_rate"`
	ServiceChargeRate     float64          `json:"service_charge_rate"`
	TaxEnabled            bool             `json:"tax_enabled"`
	AvailableCurrencies   []CurrencyOption `json:"available_currencies"`
}

type UpdateFinancialSettingsRequest struct {
	Currency            string   `json:"currency" validate:"required,len=3"`
	TaxRate             float64  `json:"tax_rate" validate:"gte=0,lte=100"`
	ServiceChargeRate   float64  `json:"service_charge_rate" validate:"gte=0,lte=100"`
	TaxEnabled          *bool    `json:"tax_enabled" validate:"required"`
}

type UpdateSupportedCurrenciesRequest struct {
	Currencies []CurrencyOption `json:"currencies" validate:"required,min=1,dive"`
}

type InvoiceSettingsResponse struct {
	ReceiptHeader     string `json:"receipt_header"`
	ReceiptFooter     string `json:"receipt_footer"`
	InvoicePrefix     string `json:"invoice_prefix"`
	ShowTaxOnReceipt  bool   `json:"show_tax_on_receipt"`
	LegalText         string `json:"legal_text"`
}

type UpdateInvoiceSettingsRequest struct {
	ReceiptHeader    string `json:"receipt_header" validate:"max=500"`
	ReceiptFooter    string `json:"receipt_footer" validate:"max=500"`
	InvoicePrefix    string `json:"invoice_prefix" validate:"max=20"`
	ShowTaxOnReceipt *bool  `json:"show_tax_on_receipt" validate:"required"`
	LegalText        string `json:"legal_text" validate:"max=1000"`
}
