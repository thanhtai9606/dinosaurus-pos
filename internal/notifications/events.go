package notifications

const (
	EventOrderCreated          = "order.created"
	EventOrderCancelled        = "order.cancelled"
	EventStockLow              = "stock.low"
	EventSupplierDebtCreated   = "supplier_debt.created"
	EventCustomerDebtCreated   = "customer_debt.created"
	EventStockReceiptCompleted = "stock_receipt.completed"
	EventReportDaily           = "report.daily"
	EventReportMonthly         = "report.monthly"
	EventReportYearly          = "report.yearly"
)

func IsReportEvent(eventType string) bool {
	return len(eventType) >= 7 && eventType[:7] == "report."
}