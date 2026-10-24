package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

func StructuredLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()
		clientIP := c.ClientIP()
		method := c.Request.Method
		reqID := c.GetString(HeaderRequestID)

		if raw != "" {
			path = path + "?" + raw
		}

		log.Printf("[HTTP] id=%s status=%d method=%s path=%s ip=%s latency=%s",
			reqID, status, method, path, clientIP, latency)
	}
}
