package middleware

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				reqID := c.GetString(HeaderRequestID)
				log.Printf("[PANIC RECOVERED] id=%s err=%v", reqID, r)

				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"error":     "Internal server error",
					"requestId": reqID,
				})
			}
		}()
		c.Next()
	}
}
