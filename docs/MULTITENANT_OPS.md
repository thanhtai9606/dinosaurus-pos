# Multi-tenant vận hành (Dinosaurus POS)

Chiến lược tổng thể: tier **shared** (RLS) cho đa số cửa hàng; tier **dedicated** (một Postgres DB per khách enterprise). Metadata tenant luôn trên shared DB (control plane).

## Routing (runtime)

1. JWT → `tenant_id` (middleware).
2. `PoolRouter.RoutingForTenant` đọc `tenants.data_plane` + `database_dsn_key` trên shared pool.
3. `shared` → pool mặc định (`DB_*`); `dedicated` → pool cache theo `os.Getenv(database_dsn_key)`.
4. `RoutedTenantDB` gọi `set_config('app.tenant_id', …)` trên pool đã chọn — RLS giữ nguyên trong DB dedicated.

Migration: `sqlc/migrations/000005_tenant_data_plane.up.sql`.

## Mô hình

| Tier | `data_plane` | Lưu trữ |
|------|----------------|---------|
| Standard | `shared` (mặc định) | Một Postgres, cột `tenant_id` + RLS |
| Enterprise | `dedicated` | Postgres DB riêng; metadata tenant vẫn trên shared (control plane) |

## Audit: pool thường vs `TenantDB`

| Thành phần | Kết nối | Lý do |
|------------|---------|--------|
| `user_repo`, auth | Shared `pgxpool` | Users global; membership `tenant_users` |
| `tenants.Repository` | Shared pool | Control plane (danh sách tenant, `data_plane`, DSN key) |
| Categories, products, orders, settings, reports, … | `TenantDB` / `RoutedTenantDB` | RLS + routing dedicated |
| Seeder `user` | Shared pool | Users không RLS |
| Seeder production data | `TenantDB` | Dữ liệu nghiệp vụ theo tenant |

Mọi bảng nghiệp vụ có `tenant_id` phải đi qua `TenantDB` (hoặc `RoutedTenantDB`), không query bằng shared pool trừ khi có lý do control plane.

## Backup & restore

### Toàn bộ shared DB

```bash
make backup
# hoặc scripts/backup.sh
```

Backup là **cả database** (`pos_kasir`), gồm mọi tenant trên tier shared.

### Export logic theo một tenant (shared tier)

Không có snapshot per-tenant native. Dùng logical export (ví dụ tenant `default`):

```bash
TENANT_ID='00000000-0000-0000-0000-000000000001'
docker exec pos-postgres psql -U pos_user -d pos_kasir -c \
  "COPY (SELECT * FROM orders WHERE tenant_id = '$TENANT_ID') TO STDOUT CSV HEADER" > orders_tenant.csv
```

Lặp cho từng bảnh có `tenant_id`. Restore = ETL thủ công hoặc restore full DB rồi xóa tenant khác (rủi ro cao).

### Dedicated DB

Mỗi DB enterprise backup riêng:

```bash
# DSN từ env TENANT_DSN_<KEY>
pg_dump "$TENANT_DSN_ACME" --clean --if-exists -f backups/acme.sql
```

## Migrate

```bash
make migrate-up                    # shared control + shared data
./scripts/migrate-all-databases.sh # shared + mọi TENANT_DSN_* trong .env
```

## Provision tenant dedicated (pilot)

```bash
./scripts/provision-tenant-db.sh \
  --code acme \
  --name "ACME Corp" \
  --dbname pos_tenant_acme \
  --env-key TENANT_DSN_ACME
```

Thêm `TENANT_DSN_ACME=postgres://.../pos_tenant_acme` vào `.env`, chạy `migrate-all`, restart API.

## Role Postgres (quan trọng cho RLS)

User tạo bởi biến `POSTGRES_USER` trong Docker **là superuser** và **bỏ qua RLS**. Dev local vẫn an toàn nhờ app set `app.tenant_id`, nhưng audit isolation cần role ứng dụng riêng:

```sql
CREATE ROLE pos_app LOGIN PASSWORD 'change_me' NOSUPERUSER NOBYPASSRLS;
GRANT CONNECT ON DATABASE pos_kasir TO pos_app;
GRANT USAGE ON SCHEMA public TO pos_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pos_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pos_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO pos_app;
```

Production: đặt `DB_USER=pos_app` (không dùng superuser cho API).

## Kiểm tra RLS

```bash
make test-integration
# hoặc:
INTEGRATION_TEST=1 INTEGRATION_DB_HOST=127.0.0.1 go test -tags=integration ./pkg/database/ -count=1 -v
```

Cần Postgres local; test **skip** nếu user hiện tại `BYPASSRLS` (mặc định `pos_user` trong Docker).
