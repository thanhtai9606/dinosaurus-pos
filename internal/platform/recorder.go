package platform

import (
	"context"
	"encoding/json"

	"dinosaurus-pos/internal/platformaudit"

	"github.com/google/uuid"
)

type auditRepo interface {
	InsertAudit(ctx context.Context, actor uuid.UUID, action, resourceType, resourceID string, details json.RawMessage) error
}

type recorder struct {
	repo auditRepo
}

func NewRecorder(repo auditRepo) platformaudit.Recorder {
	return &recorder{repo: repo}
}

func (r *recorder) Record(ctx context.Context, actor uuid.UUID, action, resourceType, resourceID string, details map[string]any) error {
	var raw json.RawMessage
	if len(details) > 0 {
		b, err := json.Marshal(details)
		if err != nil {
			return err
		}
		raw = b
	}
	return r.repo.InsertAudit(ctx, actor, action, resourceType, resourceID, raw)
}
