package printer

import (
	"dinosaurus-pos/internal/orders"
	"dinosaurus-pos/internal/payment_methods"
	"dinosaurus-pos/internal/settings"
	user_repo "dinosaurus-pos/internal/user/repository"
	"dinosaurus-pos/pkg/escpos"
	"dinosaurus-pos/pkg/logger"
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

type IPrinterService interface {
	PrintInvoice(ctx context.Context, orderID uuid.UUID) error
	TestPrint(ctx context.Context) error
	GetInvoiceData(ctx context.Context, orderID uuid.UUID) ([]byte, string, error)
	DiscoverPrinters(ctx context.Context) ([]DiscoveredPrinter, error)
}

type PrinterFactory func(connectionString string) (escpos.Printer, error)

type PrinterService struct {
	orderService         orders.IOrderService
	settingsService      settings.ISettingsService
	paymentMethodService payment_methods.IPaymentMethodService
	userRepo             user_repo.Querier
	log                  logger.ILogger
	printerFactory       PrinterFactory
}

func NewPrinterService(orderService orders.IOrderService, settingsService settings.ISettingsService, paymentMethodService payment_methods.IPaymentMethodService, userRepo user_repo.Querier, log logger.ILogger, printerFactory PrinterFactory) IPrinterService {
	return &PrinterService{
		orderService:         orderService,
		settingsService:      settingsService,
		paymentMethodService: paymentMethodService,
		userRepo:             userRepo,
		log:                  log,
		printerFactory:       printerFactory,
	}
}

func (s *PrinterService) PrintInvoice(ctx context.Context, orderID uuid.UUID) error {
	printerSettings, err := s.settingsService.GetPrinterSettings(ctx)
	if err != nil {
		return fmt.Errorf("failed to get printer settings: %w", err)
	}

	if printerSettings.PrintMethod == "FE" {
		s.log.Info("Skipping backend print (Print Method set to FE)", "orderID", orderID)
		return nil
	}

	order, branding, cashierName, paymentMethodName, invoice, err := s.prepareInvoiceData(ctx, orderID)
	if err != nil {
		return err
	}

	p, err := s.printerFactory(printerSettings.Connection)
	if err != nil {
		s.log.Error("Failed to connect to printer", "connection", printerSettings.Connection, "error", err)
		return err
	}
	defer p.Close()

	return s.printInvoiceToPrinter(ctx, p, order, branding, cashierName, paymentMethodName, invoice)
}

func (s *PrinterService) GetInvoiceData(ctx context.Context, orderID uuid.UUID) ([]byte, string, error) {
	order, branding, cashierName, paymentMethodName, invoice, err := s.prepareInvoiceData(ctx, orderID)
	if err != nil {
		return nil, "", err
	}

	bp := escpos.NewBufferPrinter()
	if err := s.printInvoiceToPrinter(ctx, bp, order, branding, cashierName, paymentMethodName, invoice); err != nil {
		return nil, "", err
	}

	filename := fmt.Sprintf("invoice_%s.bin", order.ID.String())
	return bp.Buffer.Bytes(), filename, nil
}

func (s *PrinterService) prepareInvoiceData(ctx context.Context, orderID uuid.UUID) (*orders.OrderDetailResponse, *settings.BrandingSettingsResponse, string, string, *settings.InvoiceSettingsResponse, error) {
	order, err := s.orderService.GetOrder(ctx, orderID)
	if err != nil {
		return nil, nil, "", "", nil, fmt.Errorf("failed to get order: %w", err)
	}

	branding, err := s.settingsService.GetBranding(ctx)
	if err != nil {
		return nil, nil, "", "", nil, fmt.Errorf("failed to get branding: %w", err)
	}

	invoice, err := s.settingsService.GetInvoiceSettings(ctx)
	if err != nil {
		return nil, nil, "", "", nil, fmt.Errorf("failed to get invoice settings: %w", err)
	}

	var cashierName string = "Unknown"
	if order.UserID != nil {
		user, err := s.userRepo.GetUserByID(ctx, *order.UserID)
		if err == nil {
			cashierName = user.Username
		} else {
			s.log.Warn("Failed to fetch cashier name", "userID", order.UserID, "error", err)
		}
	}

	var paymentMethodName string = "Unknown"
	if order.PaymentMethodID != nil {
		methods, err := s.paymentMethodService.ListPaymentMethods(ctx)
		if err == nil {
			for _, m := range methods {
				if m.ID == *order.PaymentMethodID {
					paymentMethodName = m.Name
					break
				}
			}
		}
	}

	return order, branding, cashierName, paymentMethodName, invoice, nil
}

func (s *PrinterService) printInvoiceToPrinter(ctx context.Context, p escpos.Printer, order *orders.OrderDetailResponse, branding *settings.BrandingSettingsResponse, cashierName, paymentMethodName string, invoice *settings.InvoiceSettingsResponse) error {
	fin, _ := s.settingsService.GetFinancialSettings(ctx)
	formatAmount := func(amount int64) string {
		return settings.FormatAmount(fin, amount)
	}
	if err := p.Init(); err != nil {
		return err
	}

	p.SetAlign(escpos.AlignCenter)
	p.SetBold(true)
	p.SetSize(escpos.DoubleHeightOn)
	p.WriteString(branding.AppName + "\n")
	p.SetSize(escpos.NormalSize)
	p.SetBold(false)
	if invoice != nil && invoice.ReceiptHeader != "" {
		p.WriteString(invoice.ReceiptHeader + "\n")
	}
	p.WriteString(fmt.Sprintf("%s\n", time.Now().Format("02 Jan 2006 15:04")))
	refLabel := "Order"
	if invoice != nil && invoice.InvoicePrefix != "" {
		refLabel = invoice.InvoicePrefix
	}
	p.WriteString(fmt.Sprintf("%s #%s\n", refLabel, order.ID.String()[len(order.ID.String())-4:]))
	p.WriteString("Cashier: " + cashierName + "\n")
	p.WriteString("--------------------------------\n")

	p.SetAlign(escpos.AlignLeft)
	for _, item := range order.Items {
		p.WriteString(item.ProductName + "\n")

		qtyLine := fmt.Sprintf("%dx %s", item.Quantity, formatAmount(item.PriceAtSale))
		totalLine := formatAmount(item.Subtotal)

		padding := 32 - len(qtyLine) - len(totalLine)
		if padding < 1 {
			padding = 1
		}

		p.WriteString(qtyLine + strings.Repeat(" ", padding) + totalLine + "\n")

		for _, opt := range item.Options {
			if opt.OptionName != "" {
				p.WriteString("   + " + opt.OptionName + "\n")
			}
		}
	}

	p.WriteString("--------------------------------\n")

	writeTotalLine(p, "Subtotal", formatAmount(order.GrossTotal))
	if order.DiscountAmount > 0 {
		writeTotalLine(p, "Discount", "-"+formatAmount(order.DiscountAmount))
	}
	if invoice != nil && invoice.ShowTaxOnReceipt {
		if order.TaxAmount > 0 {
			writeTotalLine(p, "Tax", formatAmount(order.TaxAmount))
		}
		if order.ServiceChargeAmount > 0 {
			writeTotalLine(p, "Service", formatAmount(order.ServiceChargeAmount))
		}
	}
	p.SetBold(true)
	writeTotalLine(p, "TOTAL", formatAmount(order.NetTotal))
	p.SetBold(false)

	p.WriteString("--------------------------------\n")

	if order.PaymentMethodID != nil {
		p.WriteString("Payment: " + paymentMethodName + "\n")

		if order.CashReceived != nil && *order.CashReceived > 0 {
			writeTotalLine(p, "Cash", formatAmount(*order.CashReceived))
			if order.ChangeDue != nil {
				writeTotalLine(p, "Change", formatAmount(*order.ChangeDue))
			}
		}
	} else {
		p.WriteString("UNPAID\n")
	}

	p.SetAlign(escpos.AlignCenter)
	p.WriteString("\n")
	if invoice != nil && invoice.LegalText != "" {
		p.WriteString(invoice.LegalText + "\n")
	}
	footer := branding.FooterText
	if invoice != nil && invoice.ReceiptFooter != "" {
		footer = invoice.ReceiptFooter
	}
	if footer != "" {
		p.WriteString(footer + "\n")
	} else {
		p.WriteString("© " + branding.AppName + "\n")
	}
	p.WriteString("\n")
	return p.Cut()
}

func (s *PrinterService) TestPrint(ctx context.Context) error {
	printerSettings, err := s.settingsService.GetPrinterSettings(ctx)
	if err != nil {
		return fmt.Errorf("failed to get printer settings: %w", err)
	}

	p, err := s.printerFactory(printerSettings.Connection)
	if err != nil {
		s.log.Error("Failed to connect to printer", "connection", printerSettings.Connection, "error", err)
		return err
	}
	defer p.Close()

	if err := p.Init(); err != nil {
		return err
	}

	p.SetAlign(escpos.AlignCenter)
	p.SetBold(true)
	p.WriteString("TEST PRINT SUCCESS\n")
	p.SetBold(false)
	p.WriteString("Dinosaurus POS\n")
	p.WriteString(time.Now().Format("02 Jan 2006 15:04:05") + "\n")
	p.WriteString("\n\n")

	return p.Cut()
}

func (s *PrinterService) DiscoverPrinters(ctx context.Context) ([]DiscoveredPrinter, error) {
	return DiscoverPrinters(ctx)
}

func writeTotalLine(p escpos.Printer, label, value string) {
	padding := 32 - len(label) - len(value)
	if padding < 1 {
		padding = 1
	}
	p.WriteString(label + strings.Repeat(" ", padding) + value + "\n")
}

