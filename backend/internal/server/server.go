package server

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"docora/backend/internal/config"
	"docora/backend/internal/handlers"
	"docora/backend/internal/middleware"
	"docora/backend/internal/pdf"
	"docora/backend/internal/repositories"
	"docora/backend/internal/services"
	"docora/backend/internal/storage"
)

type Server struct {
	router *gin.Engine
	cfg    *config.Config
	db     *repositories.DB
}

func NewServer(cfg *config.Config, db *repositories.DB) (*Server, error) {
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// Storage driver
	var fileStore storage.Storage
	var err error
	if cfg.DocumentStorageDriver == "s3" {
		fileStore, err = storage.NewS3Storage("docora-bucket", "us-east-1")
	} else {
		fileStore, err = storage.NewLocalStorage(cfg.DocumentStoragePath)
	}
	if err != nil {
		return nil, fmt.Errorf("failed initializing storage: %w", err)
	}

	// PDF Renderer
	pdfRenderer := pdf.NewRenderer(cfg.ChromeBin, 45*time.Second)

	// Repositories
	userRepo := repositories.NewUserRepository(db)
	businessRepo := repositories.NewBusinessRepository(db)
	customerRepo := repositories.NewCustomerRepository(db)
	templateRepo := repositories.NewTemplateRepository(db)
	docRepo := repositories.NewDocumentRepository(db)
	auditRepo := repositories.NewAuditRepository(db)

	// Services
	authService := services.NewAuthService(userRepo, cfg)
	businessService := services.NewBusinessService(businessRepo)
	customerService := services.NewCustomerService(customerRepo)
	templateService := services.NewTemplateService(templateRepo)
	docService := services.NewDocumentService(docRepo, customerRepo, businessRepo, templateRepo, auditRepo, fileStore, pdfRenderer)
	dashboardService := services.NewDashboardService(docRepo)

	// Handlers
	authHandler := handlers.NewAuthHandler(authService, userRepo)
	businessHandler := handlers.NewBusinessHandler(businessService)
	customerHandler := handlers.NewCustomerHandler(customerService)
	templateHandler := handlers.NewTemplateHandler(templateService)
	receiptHandler := handlers.NewReceiptHandler(docService)
	invoiceHandler := handlers.NewInvoiceHandler(docService)
	documentHandler := handlers.NewDocumentHandler(docService)
	dashboardHandler := handlers.NewDashboardHandler(dashboardService)
	healthHandler := handlers.NewHealthHandler(db, fileStore)

	// Rate limiter (e.g. 60 req/min for auth)
	rateLimiter := middleware.NewRateLimiter(60, time.Minute)

	// Global Middleware
	r.Use(middleware.RequestID())
	r.Use(middleware.StructuredLogger())
	r.Use(middleware.Recovery())
	r.Use(middleware.CORS(cfg.FrontendURL))

	// Health check endpoints (root level for Docker/Nginx probes)
	r.GET("/healthz", healthHandler.Healthz)
	r.GET("/readyz", healthHandler.Readyz)

	// OpenAPI and Swagger UI
	RegisterOpenAPIRoutes(r)

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Health under v1 as well
		v1.GET("/healthz", healthHandler.Healthz)
		v1.GET("/readyz", healthHandler.Readyz)

		// Auth endpoints (with rate limiting)
		authGroup := v1.Group("/auth")
		authGroup.Use(rateLimiter.Middleware())
		{
			authGroup.POST("/register", authHandler.Register)
			authGroup.POST("/login", authHandler.Login)
			authGroup.POST("/refresh", authHandler.Refresh)
			authGroup.POST("/logout", authHandler.Logout)
			authGroup.GET("/me", middleware.Auth(authService), authHandler.Me)
		}

		// Protected endpoints
		protected := v1.Group("")
		protected.Use(middleware.Auth(authService))
		{
			// Dashboard
			protected.GET("/dashboard/stats", dashboardHandler.GetStats)
			protected.GET("/dashboard/recent-documents", dashboardHandler.GetRecentDocuments)

			// Receipts
			protected.POST("/receipts", receiptHandler.Create)
			protected.GET("/receipts", receiptHandler.List)
			protected.GET("/receipts/:id", receiptHandler.GetByID)
			protected.POST("/receipts/:id/preview", receiptHandler.Preview)
			protected.POST("/receipts/:id/finalize", receiptHandler.Finalize)
			protected.POST("/receipts/:id/cancel", receiptHandler.Cancel)

			// Invoices
			protected.POST("/invoices", invoiceHandler.Create)
			protected.GET("/invoices", invoiceHandler.List)
			protected.GET("/invoices/:id", invoiceHandler.GetByID)
			protected.POST("/invoices/:id/preview", invoiceHandler.Preview)
			protected.POST("/invoices/:id/finalize", invoiceHandler.Finalize)
			protected.POST("/invoices/:id/cancel", invoiceHandler.Cancel)

			// Unified Document Library & General PDF
			protected.GET("/documents", documentHandler.List)
			protected.GET("/documents/:id", documentHandler.GetByID)
			protected.GET("/documents/:id/download", documentHandler.Download)
			protected.GET("/documents/:id/preview", documentHandler.Preview)
			protected.DELETE("/documents/:id", documentHandler.Delete)
			protected.POST("/pdf-generator/generate", documentHandler.CreateGeneralPDF)

			// Templates
			protected.GET("/templates", templateHandler.List)
			protected.POST("/templates", templateHandler.Create)
			protected.GET("/templates/:id", templateHandler.GetByID)
			protected.PUT("/templates/:id", templateHandler.Update)
			protected.POST("/templates/:id/duplicate", templateHandler.Duplicate)
			protected.DELETE("/templates/:id", templateHandler.Delete)

			// Customers
			protected.GET("/customers", customerHandler.List)
			protected.POST("/customers", customerHandler.Create)
			protected.GET("/customers/:id", customerHandler.GetByID)
			protected.PUT("/customers/:id", customerHandler.Update)
			protected.DELETE("/customers/:id", customerHandler.Delete)

			// Business Profile
			protected.GET("/business-profile", businessHandler.GetProfile)
			protected.PUT("/business-profile", businessHandler.UpdateProfile)
		}
	}

	return &Server{
		router: r,
		cfg:    cfg,
		db:     db,
	}, nil
}

func (s *Server) Run() error {
	addr := ":" + s.cfg.AppPort
	srv := &http.Server{
		Addr:         addr,
		Handler:      s.router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 120 * time.Second, // Long timeout for PDF generation
		IdleTimeout:  120 * time.Second,
	}

	// Server run context
	serverErrors := make(chan error, 1)
	go func() {
		log.Printf("Docora API server listening on %s (env: %s)", addr, s.cfg.AppEnv)
		serverErrors <- srv.ListenAndServe()
	}()

	// Graceful shutdown on SIGINT / SIGTERM
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		return fmt.Errorf("error starting server: %w", err)

	case sig := <-shutdown:
		log.Printf("Received signal %v. Initiating graceful shutdown...", sig)

		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			_ = srv.Close()
			return fmt.Errorf("could not stop server gracefully: %w", err)
		}
	}

	return nil
}
