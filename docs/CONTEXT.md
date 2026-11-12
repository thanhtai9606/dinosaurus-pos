# Ngữ cảnh dự án (dinosaur-pos / POS-kasir)

Tài liệu này gom **quyết định sản phẩm, luồng nghiệp vụ và đường dẫn code** đã triển khai trên nhánh `master`, để không phải giải thích lại từ đầu mỗi phiên làm việc. Cập nhật file khi thêm module lớn.

## Repo & vận hành

| Mục | Giá trị |
|-----|---------|
| Module Go | `POS-kasir` |
| API + SPA | Go Fiber phục vụ API và build `web/dist` (thường cổng **8080**) |
| DB | PostgreSQL 15, migrate trong `sqlc/migrations/` — **`make migrate-up`** sau mỗi deploy có migration mới |
| FE | `web/` — React 19, TanStack Router (file routes), TanStack Query, pnpm |
| i18n | `web/src/lib/locales/{vi,en,id}.json` — thêm key đủ 3 ngôn ngữ |
| RBAC FE | `web/src/lib/auth/rbacRules.ts` (map method + path → role) |
| RBAC BE | middleware role trên `server/routes.go` |

Remote hiện tại: GitLab `devops/dinosaurus-pos` (fork/tùy biến từ POS-kasir gốc).

---

## Phiếu nhập kho (stock receipts)

### UX đã chốt

| Hành động | UI |
|-----------|-----|
| Danh sách | `web/src/routes/_dashboard.stock-receipts.tsx` — lọc, chọn nhiều, in barcode, Excel, xóa (nếu được phép) |
| **Tạo mới** | **Trang full** `/stock-receipts/new` — layout giống retail POS: quét/tìm SP, bảng dòng, panel thanh toán bên phải |
| **Sửa / xem** | **Modal** `StockReceiptEditorDialog` — click một dòng trên list; rộng (~max-w-7xl) |

Draft dòng: `useStockReceiptDraft`, lookup chung `web/src/lib/retail-pos/lookupProduct.ts`.

### Thanh toán khi nhập (NCC)

**Nguồn chuẩn (mới):** cột DB trên `stock_receipts` (migration **000027**):

- `payment_mode`: `cash` \| `credit` (mặc định `cash`)
- `amount_paid`: số tiền đã trả NCC lúc hoàn tất (≤ tổng phiếu)

**Legacy:** phiếu cũ có thể chỉ có metadata JSON trong `note` với marker `__payment__` — parse qua `web/src/lib/stock-receipts/paymentNote.ts` (`stripPaymentFromNote` / `embedPaymentInNote`). **Không backfill** sang cột DB trong MVP.

**FE gửi API:** create/update gửi `payment_mode`, `amount_paid` và `note` thuần (không nhúng payment vào note trên luồng mới). File: `_dashboard.stock-receipts.new.tsx`, `StockReceiptEditorDialog.tsx`, DTO `internal/stockreceipts/dto.go`.

**BE:** `applyReceiptPayment` trong `internal/stockreceipts/service.go`; khi **`Complete`**, nếu `total - amount_paid > 0` → tạo **một** `supplier_debts` gắn `stock_receipt_id` (`internal/supplierdebts/integrate.go`).

---

## Công nợ MVP (supplier AP + customer AR)

### Phạm vi đã làm (v1)

- Sổ nợ: list, chi tiết, lịch sử payment, thu/chi **một phần**, khoản **thủ công**, void.
- Tổng hợp theo đối tác: `GET /supplier-debts/summary`, `GET /customer-debts/summary`.
- Trạng thái: `open` \| `partial` \| `settled` \| `void`.
- Số còn nợ: `balance_due = total_amount - amount_paid` (denormalized `amount_paid` trên header khoản nợ).

### Không làm trong MVP

- Aging, hạn mức, nhắc nợ, Excel báo cáo công nợ.
- Đồng bộ kế toán / trừ quỹ ca khi trả NCC (chỉ ghi sổ nợ).
- Backfill phiếu nhập cũ từ `__payment__` trong `note`.

### Bảng DB (migration `000027_debt_ledgers`)

- `supplier_debts`, `supplier_debt_payments`
- `customer_debts`, `customer_debt_payments`
- FK: RESTRICT; `stock_receipt_id` / `order_id` UNIQUE nullable (một khoản tự động / một nguồn).

### API (role Manager+ trừ khi ghi chú khác)

| Nhóm | Path |
|------|------|
| NCC | `GET/POST /supplier-debts`, `GET /supplier-debts/summary`, `GET /supplier-debts/:id`, `POST .../payments`, `POST .../void` |
| Khách | `GET/POST /customer-debts`, `GET /customer-debts/summary`, `GET /customer-debts/:id`, `POST .../payments`, `POST .../void` |

Package Go mirror: `internal/supplierdebts`, `internal/customerdebts` — wire trong `server/server.go`, `server/routes.go`.

### Tích hợp sự kiện (orders + receipts)

| Sự kiện | Hành vi |
|---------|---------|
| `StockReceipt` **Complete** | Còn nợ → `CreateDebtFromStockReceiptTx` |
| `CreateOrder` | Có `customer_id` và đơn chưa paid, `net_total > 0` → `CreateDebtFromOrderTx` |
| `CancelOrder` | `VoidDebtByOrderTx` |
| `ConfirmManualPayment` (Giao dịch) | `RecordOrderPaymentTx` — settle receivable gắn đơn, tránh double-count với thu qua module công nợ |
| `POST .../debts/:id/payments` | Tăng `amount_paid`; nếu đủ và có `order_id` → có thể gọi confirm thanh toán đơn trong cùng transaction (xem `customerdebts/service.go`) |

**Idempotency:** không tạo 2 supplier debt cho cùng `stock_receipt_id` / 2 customer debt cho cùng `order_id`.

### Frontend

| Route | File |
|-------|------|
| `/supplier-debts` | `_dashboard.supplier-debts.tsx` |
| `/customer-debts` | `_dashboard.customer-debts.tsx` |
| Query | `web/src/lib/api/query/supplierDebts.ts`, `customerDebts.ts` |
| Chi tiết + ghi trả | `web/src/components/debts/PartnerDebtDetailSheet.tsx` |
| Menu | `web/src/hooks/useNavigationMenu.ts` — mục công nợ NCC / khách |

---

## Retail POS & ghi nợ khách

- Retail: route retail POS (sidebar `retail_pos`); tab nhiều giỏ, barcode/search.
- Ghi nợ: đặt hàng có `customer_id`, thanh toán sau → đơn unpaid + **customer_debts**; thu tại **Công nợ khách** hoặc **Giao dịch** (matrix test dưới).

---

## Ma trận kiểm thử thủ công (công nợ)

| Kịch bản | Kỳ vọng |
|----------|---------|
| Hoàn tất nhập, trả một phần | `supplier_debts` balance đúng; trả thêm → `partial` → `settled` |
| POS ghi nợ có khách | `customer_debts` xuất hiện; thu module → đơn `paid` khi đủ |
| Khoản thủ công | POST manual; partial payment |
| Hủy đơn | receivable `void` |
| Thu full tại Giao dịch | receivable `settled`, không payment trùng |

---

## Lệnh hữu ích

```bash
make migrate-up          # áp migration (cần Postgres / make dev-infra)
go build ./...           # compile BE
cd web && pnpm run build # compile FE
```

sqlc: query debt nằm trong `internal/*/sql/` và repository `*.sql.go`; nếu sửa SQL thì chỉnh tay hoặc `make sqlc-generate` khi có sqlc CLI.

---

## Commit gần đây (tham chiếu)

- `c6a4a45` — Debt ledgers MVP + stock receipt `payment_mode` / `amount_paid` + trang công nợ + luồng tạo phiếu nhập mới.
- Trước đó: stock receipts UX (modal rộng, bulk, delete API, barcode dòng).

Khi mở rộng (aging, backfill, link từ màn Customers/Suppliers), **cập nhật section tương ứng trong file này** và rule `.cursor/rules/project-domain-context.mdc`.
