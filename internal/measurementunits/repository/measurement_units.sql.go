package repository

import (
	"context"

	"github.com/google/uuid"
)

const countMeasurementUnits = `-- name: CountMeasurementUnits :one
SELECT COUNT(*) FROM measurement_units
WHERE deleted_at IS NULL
  AND (
    $1::text IS NULL
    OR btrim($1::text) = ''
    OR name ILIKE '%' || btrim($1::text) || '%'
    OR code ILIKE '%' || btrim($1::text) || '%'
  )
`

func (q *Queries) CountMeasurementUnits(ctx context.Context, search *string) (int64, error) {
	row := q.db.QueryRow(ctx, countMeasurementUnits, search)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const countProductsUsingMeasurementUnit = `-- name: CountProductsUsingMeasurementUnit :one
SELECT COUNT(*)::bigint FROM products p
WHERE p.deleted_at IS NULL
  AND (
    LOWER(TRIM(p.unit)) = LOWER($1::text)
    OR LOWER(TRIM(p.unit)) = LOWER($2::text)
  )
`

type CountProductsUsingMeasurementUnitParams struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

func (q *Queries) CountProductsUsingMeasurementUnit(ctx context.Context, arg CountProductsUsingMeasurementUnitParams) (int64, error) {
	row := q.db.QueryRow(ctx, countProductsUsingMeasurementUnit, arg.Code, arg.Name)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const createMeasurementUnit = `-- name: CreateMeasurementUnit :one
INSERT INTO measurement_units (code, name)
VALUES ($1, $2)
RETURNING id, tenant_id, code, name, created_at, updated_at, deleted_at
`

type CreateMeasurementUnitParams struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

func (q *Queries) CreateMeasurementUnit(ctx context.Context, arg CreateMeasurementUnitParams) (MeasurementUnit, error) {
	row := q.db.QueryRow(ctx, createMeasurementUnit, arg.Code, arg.Name)
	var i MeasurementUnit
	err := row.Scan(
		&i.ID,
		&i.TenantID,
		&i.Code,
		&i.Name,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeletedAt,
	)
	return i, err
}

const deleteMeasurementUnit = `-- name: DeleteMeasurementUnit :exec
UPDATE measurement_units SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL
`

func (q *Queries) DeleteMeasurementUnit(ctx context.Context, id uuid.UUID) error {
	_, err := q.db.Exec(ctx, deleteMeasurementUnit, id)
	return err
}

const getMeasurementUnitByID = `-- name: GetMeasurementUnitByID :one
SELECT id, tenant_id, code, name, created_at, updated_at, deleted_at FROM measurement_units WHERE id = $1 AND deleted_at IS NULL
`

func (q *Queries) GetMeasurementUnitByID(ctx context.Context, id uuid.UUID) (MeasurementUnit, error) {
	row := q.db.QueryRow(ctx, getMeasurementUnitByID, id)
	var i MeasurementUnit
	err := row.Scan(
		&i.ID,
		&i.TenantID,
		&i.Code,
		&i.Name,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeletedAt,
	)
	return i, err
}

const insertMeasurementUnitIfMissing = `-- name: InsertMeasurementUnitIfMissing :exec
INSERT INTO measurement_units (tenant_id, code, name)
SELECT $1::uuid, $2::varchar, $3::varchar
WHERE NOT EXISTS (
    SELECT 1 FROM measurement_units mu
    WHERE mu.tenant_id = $1::uuid
      AND mu.code = $2::varchar
      AND mu.deleted_at IS NULL
)
`

type InsertMeasurementUnitIfMissingParams struct {
	TenantID uuid.UUID `json:"tenant_id"`
	Code     string    `json:"code"`
	Name     string    `json:"name"`
}

func (q *Queries) InsertMeasurementUnitIfMissing(ctx context.Context, arg InsertMeasurementUnitIfMissingParams) error {
	_, err := q.db.Exec(ctx, insertMeasurementUnitIfMissing, arg.TenantID, arg.Code, arg.Name)
	return err
}

const listMeasurementUnits = `-- name: ListMeasurementUnits :many
SELECT id, tenant_id, code, name, created_at, updated_at, deleted_at FROM measurement_units
WHERE deleted_at IS NULL
  AND (
    $3::text IS NULL
    OR btrim($3::text) = ''
    OR name ILIKE '%' || btrim($3::text) || '%'
    OR code ILIKE '%' || btrim($3::text) || '%'
  )
ORDER BY name ASC
LIMIT $1 OFFSET $2
`

type ListMeasurementUnitsParams struct {
	Limit  int32   `json:"limit"`
	Offset int32   `json:"offset"`
	Search *string `json:"search"`
}

func (q *Queries) ListMeasurementUnits(ctx context.Context, arg ListMeasurementUnitsParams) ([]MeasurementUnit, error) {
	rows, err := q.db.Query(ctx, listMeasurementUnits, arg.Limit, arg.Offset, arg.Search)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []MeasurementUnit{}
	for rows.Next() {
		var i MeasurementUnit
		if err := rows.Scan(
			&i.ID,
			&i.TenantID,
			&i.Code,
			&i.Name,
			&i.CreatedAt,
			&i.UpdatedAt,
			&i.DeletedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const updateMeasurementUnit = `-- name: UpdateMeasurementUnit :one
UPDATE measurement_units
SET code = $2,
    name = $3,
    updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING id, tenant_id, code, name, created_at, updated_at, deleted_at
`

type UpdateMeasurementUnitParams struct {
	ID   uuid.UUID `json:"id"`
	Code string    `json:"code"`
	Name string    `json:"name"`
}

func (q *Queries) UpdateMeasurementUnit(ctx context.Context, arg UpdateMeasurementUnitParams) (MeasurementUnit, error) {
	row := q.db.QueryRow(ctx, updateMeasurementUnit, arg.ID, arg.Code, arg.Name)
	var i MeasurementUnit
	err := row.Scan(
		&i.ID,
		&i.TenantID,
		&i.Code,
		&i.Name,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeletedAt,
	)
	return i, err
}
