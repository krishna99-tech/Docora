package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type clientLimit struct {
	count     int
	lastReset time.Time
}

type RateLimiter struct {
	mu      sync.Mutex
	clients map[string]*clientLimit
	limit   int
	window  time.Duration
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		clients: make(map[string]*clientLimit),
		limit:   limit,
		window:  window,
	}

	// Periodic cleanup of stale entries
	go func() {
		for {
			time.Sleep(window * 2)
			rl.mu.Lock()
			now := time.Now()
			for ip, entry := range rl.clients {
				if now.Sub(entry.lastReset) > rl.window*2 {
					delete(rl.clients, ip)
				}
			}
			rl.mu.Unlock()
		}
	}()

	return rl
}

func (rl *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		now := time.Now()

		rl.mu.Lock()
		client, exists := rl.clients[ip]
		if !exists || now.Sub(client.lastReset) > rl.window {
			rl.clients[ip] = &clientLimit{count: 1, lastReset: now}
			rl.mu.Unlock()
			c.Next()
			return
		}

		if client.count >= rl.limit {
			rl.mu.Unlock()
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded. Please try again later.",
			})
			return
		}

		client.count++
		rl.mu.Unlock()
		c.Next()
	}
}
