package store

import (
	"context"

	"dinosaurus-pos/internal/tenant"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store interface {
	ExecTx(ctx context.Context, fn func(pgx.Tx) error) error
}

type SQLStore struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) Store {
	return &SQLStore{
		db: db,
	}
}

func (store *SQLStore) ExecTx(ctx context.Context, fn func(pgx.Tx) error) (err error) {
	tx, err := store.db.Begin(ctx)
	if err != nil {
		return err
	}

	if tid, ok := tenant.IDFromContext(ctx); ok {
		if _, err = tx.Exec(ctx, `SELECT set_config('app.tenant_id', $1, true)`, tid.String()); err != nil {
			_ = tx.Rollback(ctx)
			return err
		}
	}

	defer func() {
		if p := recover(); p != nil {
			// Rollback on panic
			_ = tx.Rollback(ctx)
			panic(p) // re-throw panic after rollback
		} else if err != nil {
			// Rollback on error
			_ = tx.Rollback(ctx)
		} else {
			// Commit on success
			err = tx.Commit(ctx)
		}
	}()

	err = fn(tx)
	return err
}
