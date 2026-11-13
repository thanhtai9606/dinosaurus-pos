package platform

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type OverviewDTO struct {
	TenantTotal         int              `json:"tenant_total"`
	TenantActive        int              `json:"tenant_active"`
	TenantShared        int              `json:"tenant_shared"`
	TenantDedicated     int              `json:"tenant_dedicated"`
	DedicatedMissingDSN []DedicatedIssue `json:"dedicated_missing_dsn"`
	DedicatedPoolsOpen  int              `json:"dedicated_pools_open"`
	DatabaseOK          bool             `json:"database_ok"`
	SchemaVersion       int              `json:"schema_version"`
	SchemaDirty         bool             `json:"schema_dirty"`
}

func ToOverviewDTO(o Overview) OverviewDTO {
	return OverviewDTO(o)
}

type MembershipDTO struct {
	UserID       uuid.UUID `json:"user_id"`
	Email        string    `json:"email"`
	Username     string    `json:"username"`
	GlobalRole   string    `json:"global_role"`
	TenantID     *uuid.UUID `json:"tenant_id,omitempty"`
	TenantCode   *string   `json:"tenant_code,omitempty"`
	TenantName   *string   `json:"tenant_name,omitempty"`
	TenantRole   *string   `json:"tenant_role,omitempty"`
	IsSuperAdmin bool      `json:"is_super_admin"`
}

func MembershipDTOs(rows []MembershipRow) []MembershipDTO {
	out := make([]MembershipDTO, 0, len(rows))
	for _, r := range rows {
		d := MembershipDTO{
			UserID: r.UserID, Email: r.Email, Username: r.Username,
			GlobalRole: r.GlobalRole, IsSuperAdmin: r.IsSuperAdmin,
		}
		if !r.IsSuperAdmin {
			tid := r.TenantID
			tc := r.TenantCode
			tn := r.TenantName
			d.TenantID = &tid
			d.TenantCode = &tc
			d.TenantName = &tn
			d.TenantRole = r.TenantRole
		}
		out = append(out, d)
	}
	return out
}

type AuditDTO struct {
	ID           uuid.UUID       `json:"id"`
	ActorUserID  *uuid.UUID      `json:"actor_user_id,omitempty"`
	ActorEmail   *string         `json:"actor_email,omitempty"`
	Action       string          `json:"action"`
	ResourceType string          `json:"resource_type"`
	ResourceID   *string         `json:"resource_id,omitempty"`
	Details      json.RawMessage `json:"details,omitempty"`
	CreatedAt    time.Time       `json:"created_at"`
}

func AuditDTOs(rows []AuditRow) []AuditDTO {
	out := make([]AuditDTO, 0, len(rows))
	for _, r := range rows {
		out = append(out, AuditDTO{
			ID: r.ID, ActorUserID: r.ActorUserID, ActorEmail: r.ActorEmail,
			Action: r.Action, ResourceType: r.ResourceType, ResourceID: r.ResourceID,
			Details: r.Details, CreatedAt: r.CreatedAt,
		})
	}
	return out
}
