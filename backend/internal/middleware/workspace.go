package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"docora/backend/internal/services"
)

const (
	ContextWorkspaceIDKey = "workspaceId"
)

// WorkspaceContext ensures every authenticated request has a valid workspaceId in context
func WorkspaceContext(wsService *services.WorkspaceService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var wsID uuid.UUID

		// 1. Check X-Workspace-ID header
		headerVal := strings.TrimSpace(c.GetHeader("X-Workspace-ID"))
		if headerVal != "" {
			if parsed, err := uuid.Parse(headerVal); err == nil && parsed != uuid.Nil {
				wsID = parsed
			}
		}

		// 2. Check query param ?workspace_id= or ?workspaceId=
		if wsID == uuid.Nil {
			queryVal := strings.TrimSpace(c.Query("workspace_id"))
			if queryVal == "" {
				queryVal = strings.TrimSpace(c.Query("workspaceId"))
			}
			if queryVal != "" {
				if parsed, err := uuid.Parse(queryVal); err == nil && parsed != uuid.Nil {
					wsID = parsed
				}
			}
		}

		// 3. Fallback: Lookup or auto-create default workspace for authenticated user
		if wsID == uuid.Nil {
			if userID, ok := GetUserID(c); ok && userID != uuid.Nil {
				userEmail, _ := c.Get(ContextUserEmailKey)
				emailStr, _ := userEmail.(string)
				nameStr := "My"
				if parts := strings.Split(emailStr, "@"); len(parts) > 0 && parts[0] != "" {
					nameStr = parts[0]
				}

				if defWs, err := wsService.GetOrCreateDefaultWorkspace(c.Request.Context(), userID, nameStr); err == nil && defWs != nil {
					wsID = defWs.ID
				} else {
					wsID = userID
				}
			}
		}

		if wsID != uuid.Nil {
			c.Set(ContextWorkspaceIDKey, wsID)
			c.Set("workspaceID", wsID)
			c.Header("X-Workspace-ID", wsID.String())
		}

		c.Next()
	}
}

// GetWorkspaceID retrieves the workspace UUID from gin context
func GetWorkspaceID(c *gin.Context) (uuid.UUID, bool) {
	if val, exists := c.Get(ContextWorkspaceIDKey); exists {
		if id, ok := val.(uuid.UUID); ok && id != uuid.Nil {
			return id, true
		}
	}
	if val, exists := c.Get("workspaceID"); exists {
		if id, ok := val.(uuid.UUID); ok && id != uuid.Nil {
			return id, true
		}
	}
	return uuid.Nil, false
}
