# Ngữ cảnh dự án (Dinosaurus POS)

Tài liệu này gom **quyết định sản phẩm, luồng nghiệp vụ và đường dẫn code** đã triển khai trên nhánh `master`, để không phải giải thích lại từ đầu mỗi phiên làm việc. Cập nhật file khi thêm module lớn.

## Repo & vận hành

| Mục | Giá trị |
|-----|---------|
| Module Go | `dinosaurus-pos` |
| API + SPA | Go Fiber phục vụ API và build `web/dist` (thường cổng **8080**) |
| DB | PostgreSQL 15, migrate trong `sqlc/migrations/` — `000001`–`000005` (multitenant, super admin, branding, `data_plane`). Reset sạch: `make db-reset` |
| Multi-tenant ops | `docs/MULTITENANT_OPS.md` — RLS audit, backup, `migrate-all-databases`, provision dedicated |
| FE | `web/` — React 19, TanStack Router (file routes), TanStack Query, **Zustand** (list/filter state, không sync URL), pnpm |
| i18n | `web/src/lib/locales/{vi,en,id}.json` — thêm key đủ 3 ngôn ngữ |
| RBAC FE | `web/src/lib/auth/rbacRules.ts` (map method + path → role) |
| RBAC BE | middleware role trên `server/routes.go` |

Remote hiện tại: GitLab `devops/dinosaurus-pos` (fork/tùy biến từ POS-kasir gốc; module Go: `dinosaurus-pos`).

### Mã nghiệp vụ (UUID vẫn là khóa chính)

| Thực thể | Cột DB | Format mới | Ghi chú |
|----------|--------|------------|---------|
| Đơn bán | `orders.order_no` | `SO-YYYYMMDD-####` | Tạo lúc `CreateOrder`; tìm `GET /orders?search=` |
| Khách | `customers.code` | `CUS-######` | Tìm trong list customers `search` |
| Sản phẩm | `products.code` | `P-######` | Khác SKU/barcode bán lẻ; tìm trong list products |
| Phiếu nhập | `stock_receipts.receipt_no` | `GR-YYYYMMDD-###` | Đã có từ trước |
| NCC | `suppliers.code` | tùy nhập | Đã có từ trước |

Schema mã nghiệp vụ (`order_no`, `customers.code`, `products.code`) nằm trong baseline — không cần migration riêng sau khi reset.

### Catalog seed (đa mô hình demo)

- Seeder: `pkg/database/seeder/production_catalog_vn.go` + `SeedProductionData` — ~22 SKU mẫu chia **cà phê/F&B**, **quán ăn**, **bán lẻ FMCG**, **điện tử**, **thời trang**, combo.
- Mỗi SP seed có `code` cố định (`P-000001`…), `sku` nội bộ, `unit` (ly/phần/chai/cái…); sau insert gọi `products.EnsureBaseProductUnit` (đơn vị bán cho POS).
- **Barcode:** chỉ gán cho bán lẻ/điện tử/một số fashion (EAN demo `893…`); F&B/cafe dùng `product_options` (size, topping…) — không bắt buộc barcode.
- **Áp dụng catalog mới:** `make db-reset` (hoặc DB trống + `make seed`). `SeedProductionData` **bỏ qua** khi đã có >100 đơn — cần reset để thay catalog cũ. Sau reset, bật `MEILI_AUTO_REINDEX=true` nếu cần search lại.

---

## Multi-tenant (MVP)

- Bảng `tenants`, `tenant_users`; cột `tenant_id` trên dữ liệu nghiệp vụ; **RLS** theo `app.tenant_id` (set qua `pkg/database/tenant_db.go` / `NewRoutedTenantDB` + `store.ExecTx`).
- Tier **shared** (mặc định) hoặc **dedicated** (`tenants.data_plane`, `database_dsn_key` → env `TENANT_DSN_*`; routing `pkg/database/pool_router.go`).
- **Đăng nhập:** bắt buộc `tenant_code` + email + password. Vai trò JWT = `super_admin` hoặc `COALESCE(tenant_users.role, users.role)` trong tenant đó.
- **super_admin:** chỉ menu **Nền tảng**; quản lý user **theo từng tenant** — tab « Người dùng » trong dialog sửa cửa hàng (`GET/POST/PUT/DELETE /api/v1/tenants/:id/members`). Home `/platform/overview`. Demo: `superadmin@example.com` / `1q2w3E*`, tenant `default`.
- **admin tenant:** chỉ user thuộc tenant (JWT); tạo/sửa user trong tenant hiện tại (`POST /users` gán `tenant_users`).
- `POST /auth/switch-tenant` (API còn, FE không switch — user làm việc trên tenant đã chọn lúc login).
- Tenant mặc định: UUID `00000000-0000-0000-0000-000000000001`, code `default` — seed + backfill migration.
- FE chrome: `DashboardTopBar` — welcome + ca + theme + profile; ngôn ngữ trong Settings → Preferences.
- **Redis:** `tenant:lookup:v1:{code}` (login lookup, TTL 15m / miss 2m); `platform:overview:v1` (~45s); **`products:list:v1:*` / `products:search:v1:*`** (list + search GET, TTL ~30–45s, bump version khi CRUD SP); báo cáo & shift như cũ.
- **Meilisearch:** field `tenant_id` filterable; search sản phẩm theo tenant JWT; auto-reindex mọi tenant active khi `MEILI_AUTO_REINDEX=true`.

### FE list & DataGrid (chuẩn)

- Route chỉ path; pagination/filter trong Zustand (`stores/create-list-store.ts`, `LIST_SCOPES`).
- Dữ liệu: TanStack Query + REST; debounce search + `useResetPageOnChange`.
- Bảng: `DataGrid` **server-side** pagination khi có API `pagination`; client filter/sort chỉ cho tập nhỏ.
- Chi tiết: `.cursor/rules/web-list-state-zustand.mdc`, `web-data-grid.mdc`.

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

**Nguồn chuẩn (mới):** cột DB trên `stock_receipts` (baseline):

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

### Bảng DB (công nợ — trong baseline)

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
| Menu | Sidebar nhóm **Khách hàng** → danh sách, **nhóm khách** (`/customer-groups`), công nợ; NCC tách riêng (`useNavigationMenu.ts`) |

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
