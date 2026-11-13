package products

import (
	"bytes"
	"fmt"
	"strconv"
	"strings"

	products_repo "dinosaurus-pos/internal/products/repository"

	"github.com/xuri/excelize/v2"
)

const priceSheetName = "prices"

var importPriceHeaders = []string{"sku", "product_id", "name", "cost_price", "price"}

func BuildImportPricesTemplateXLSX() ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()
	sheet := priceSheetName
	idx, err := f.NewSheet(sheet)
	if err != nil {
		return nil, err
	}
	_ = f.DeleteSheet("Sheet1")
	f.SetActiveSheet(idx)

	for i, h := range importPriceHeaders {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
	}
	note, _ := excelize.CoordinatesToCellName(1, 3)
	_ = f.SetCellValue(sheet, note, "Điền sku hoặc product_id; cost_price và/hoặc price. Cột name chỉ tham khảo khi import.")

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func BuildProductPricesExportXLSX(rows []products_repo.ListProductsForPriceExportRow) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()
	sheet := priceSheetName
	idx, err := f.NewSheet(sheet)
	if err != nil {
		return nil, err
	}
	_ = f.DeleteSheet("Sheet1")
	f.SetActiveSheet(idx)

	headers := []string{"sku", "product_id", "name", "cost_price", "price", "stock", "min_stock", "unit"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
	}

	for r, row := range rows {
		line := r + 2
		sku := ""
		if row.Sku != nil {
			sku = *row.Sku
		}
		_ = f.SetCellValue(sheet, cellAt(1, line), sku)
		_ = f.SetCellValue(sheet, cellAt(2, line), row.ID.String())
		_ = f.SetCellValue(sheet, cellAt(3, line), row.Name)
		_ = f.SetCellValue(sheet, cellAt(4, line), numericToFloat(row.CostPrice))
		_ = f.SetCellValue(sheet, cellAt(5, line), row.Price)
		_ = f.SetCellValue(sheet, cellAt(6, line), row.Stock)
		_ = f.SetCellValue(sheet, cellAt(7, line), row.MinStock)
		_ = f.SetCellValue(sheet, cellAt(8, line), row.Unit)
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func cellAt(col, row int) string {
	c, _ := excelize.CoordinatesToCellName(col, row)
	return c
}

func ParseImportPricesXLSX(data []byte) ([]ImportPriceRow, error) {
	f, err := excelize.OpenReader(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("invalid xlsx: %w", err)
	}
	defer f.Close()

	sheet := f.GetSheetName(0)
	if sheet == "" {
		sheet = priceSheetName
	}
	rows, err := f.GetRows(sheet)
	if err != nil || len(rows) == 0 {
		return nil, fmt.Errorf("empty spreadsheet")
	}

	col := map[string]int{}
	for i, h := range rows[0] {
		key := strings.ToLower(strings.TrimSpace(h))
		key = strings.ReplaceAll(key, " ", "_")
		col[key] = i
	}

	idx := func(names ...string) int {
		for _, n := range names {
			if i, ok := col[n]; ok {
				return i
			}
		}
		return -1
	}

	skuI := idx("sku", "product_sku")
	idI := idx("product_id", "id")
	costI := idx("cost_price", "cost", "unit_cost", "gia_von")
	priceI := idx("price", "sell_price", "selling_price", "gia_ban")

	if skuI < 0 && idI < 0 {
		return nil, fmt.Errorf("spreadsheet must include sku or product_id column")
	}
	if costI < 0 && priceI < 0 {
		return nil, fmt.Errorf("spreadsheet must include cost_price and/or price column")
	}

	parseF := func(row []string, i int) *float64 {
		if i < 0 || i >= len(row) {
			return nil
		}
		s := strings.TrimSpace(row[i])
		if s == "" {
			return nil
		}
		v, err := strconv.ParseFloat(s, 64)
		if err != nil {
			return nil
		}
		return &v
	}

	var out []ImportPriceRow
	for line := 1; line < len(rows); line++ {
		row := rows[line]
		if len(row) == 0 {
			continue
		}
		item := ImportPriceRow{}
		if skuI >= 0 && skuI < len(row) {
			item.Sku = strings.TrimSpace(row[skuI])
		}
		if idI >= 0 && idI < len(row) {
			item.ProductID = strings.TrimSpace(row[idI])
		}
		item.CostPrice = parseF(row, costI)
		item.Price = parseF(row, priceI)
		if item.Sku == "" && item.ProductID == "" {
			continue
		}
		if item.CostPrice == nil && item.Price == nil {
			continue
		}
		out = append(out, item)
	}
	if len(out) == 0 {
		return nil, fmt.Errorf("no data rows")
	}
	return out, nil
}
