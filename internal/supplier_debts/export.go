package supplier_debts

import (
	"bytes"
	"context"
	"fmt"

	sd_repo "dinosaurus-pos/internal/supplier_debts/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/xuri/excelize/v2"
)

func (s *SupplierDebtService) ExportExcel(ctx context.Context, req ListSupplierDebtsRequest) ([]byte, error) {
	params := sd_repo.ListSupplierDebtsForExportParams{}
	if req.SupplierID != nil {
		params.SupplierID = pgtype.UUID{Bytes: *req.SupplierID, Valid: true}
	}
	if req.Status != nil {
		s := sd_repo.DebtStatus(*req.Status)
		params.Status = &s
	}
	rows, err := s.repo.ListSupplierDebtsForExport(ctx, params)
	if err != nil {
		return nil, err
	}
	f := excelize.NewFile()
	sheet := f.GetSheetName(0)
	headers := []string{"Mã tham chiếu", "Nhà cung cấp", "Tổng", "Đã trả", "Còn lại", "Trạng thái", "Tuổi nợ (ngày)", "Ngày phát sinh"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
	}
	for i, r := range rows {
		row := i + 2
		total := sd_repo.NumericToFloat(r.TotalAmount)
		paid := sd_repo.NumericToFloat(r.AmountPaid)
		_ = setRow(f, sheet, row, []interface{}{
			r.ReferenceNo,
			r.SupplierName,
			total,
			paid,
			total - paid,
			string(r.Status),
			r.AgeDays,
			r.IssuedAt.Time.Format("2006-01-02"),
		})
	}
	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func setRow(f *excelize.File, sheet string, row int, vals []interface{}) error {
	for i, v := range vals {
		cell, err := excelize.CoordinatesToCellName(i+1, row)
		if err != nil {
			return err
		}
		if err := f.SetCellValue(sheet, cell, v); err != nil {
			return err
		}
	}
	return nil
}

func exportFileName(prefix string, supplierID *uuid.UUID) string {
	if supplierID != nil {
		return fmt.Sprintf("%s_%s.xlsx", prefix, supplierID.String()[:8])
	}
	return prefix + ".xlsx"
}