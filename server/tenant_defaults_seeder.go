package server

import (
	"context"

	"dinosaurus-pos/internal/customergroups"
	"dinosaurus-pos/internal/measurementunits"

	"github.com/google/uuid"
)

type tenantDefaultsSeeder struct {
	customerGroups   customergroups.ICustomerGroupService
	measurementUnits measurementunits.IService
}

func (s *tenantDefaultsSeeder) SeedDefaults(ctx context.Context, tenantID uuid.UUID) error {
	if err := s.customerGroups.SeedDefaults(ctx, tenantID); err != nil {
		return err
	}
	return s.measurementUnits.SeedDefaults(ctx, tenantID)
}
