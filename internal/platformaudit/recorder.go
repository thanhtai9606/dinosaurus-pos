package platformaudit

import (
	"context"

	"github.com/google/uuid"
)

// Recorder persists super-admin platform audit events.
type Recorder interface {
	Record(ctx context.Context, actor uuid.UUID, action, resourceType, resourceID string, details map[string]any) error
}
