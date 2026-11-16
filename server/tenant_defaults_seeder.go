package server

import (
	"context"

	"dinosaurus-pos/internal/customergroups"
	"dinosaurus-pos/internal/measurementunits"
	"dinosaurus-pos/internal/warehouse"

	"github.com/google/uuid"
)

type tenantDefaultsSeeder struct {
	customerGroups   customergroups.ICustomerGroupService
	measurementUnits measurementunits.IService
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
