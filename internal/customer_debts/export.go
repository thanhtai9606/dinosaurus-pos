package customer_debts

import (
	"bytes"
	"context"

	cd_repo "dinosaurus-pos/internal/customer_debts/repository"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/xuri/excelize/v2"
)

func (s *CustomerDebtService) ExportExcel(ctx context.Context, req ListCustomerDebtsRequest) ([]byte, error) {
	params := cd_repo.ListCustomerDebtsForExportParams{}
	if req.CustomerID != nil {
		params.CustomerID = pgtype.UUID{Bytes: *req.CustomerID, Valid: true}
	}
	if req.Status != nil {
		s := cd_repo.DebtStatus(*req.Status)
		params.Status = &s
	}
	rows, err := s.repo.ListCustomerDebtsForExport(ctx, params)
	if err != nil {
		return nil, err
	}
	f := excelize.NewFile()
	sheet := f.GetSheetName(0)
	headers := []string{"Mã tham chiếu", "Khách hàng", "Tổng", "Đã thu", "Còn lại", "Trạng thái", "Tuổi nợ (ngày)", "Ngày phát sinh"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
	}
	for i, r := range rows {
		row := i + 2
		total := cd_repo.NumericToFloat(r.TotalAmount)
		paid := cd_repo.NumericToFloat(r.AmountPaid)
		for col, v := range []interface{}{
			r.ReferenceNo,
			r.CustomerName,
			total,
			paid,
			total - paid,
			string(r.Status),
			r.AgeDays,
			r.IssuedAt.Time.Format("2006-01-02"),
		} {
			cell, _ := excelize.CoordinatesToCellName(col+1, row)
			_ = f.SetCellValue(sheet, cell, v)
		}
	}
	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}