package server

import (
	"context"

	"dinosaurus-pos/internal/customer_groups"
	"dinosaurus-pos/internal/measurement_units"
	"dinosaurus-pos/internal/warehouse"

	"github.com/google/uuid"
)

type tenantDefaultsSeeder struct {
	customerGroups   customer_groups.ICustomerGroupService
	measurementUnits measurement_units.IService
	warehouses       warehouse.IService
}

func (s *tenantDefaultsSeeder) SeedDefaults(ctx context.Context, tenantID uuid.UUID) error {
	if err := s.customerGroups.SeedDefaults(ctx, tenantID); err != nil {
		return err
	}
	if err := s.measurementUnits.SeedDefaults(ctx, tenantID); err != nil {
		return err
	}
	return s.warehouses.SeedDefaults(ctx, tenantID)
}
