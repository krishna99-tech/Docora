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
	"docora/backend/internal/pdfutils"
	"docora/backend/internal/repositories"
	"docora/backend/internal/services"
	"docora/backend/internal/storage"
	"docora/backend/internal/verification"
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
	wsRepo := repositories.NewWorkspaceRepository(db)
	sharingRepo := repositories.NewSharingRepository(db)
	verificationRepo := repositories.NewVerificationRepository(db)
	jobsRepo := repositories.NewJobRepository(db)
	versionRepo := repositories.NewVersionRepository(db)
	devRepo := repositories.NewDeveloperRepository(db)
	workflowRepo := repositories.NewWorkflowRepository(db)
	billingRepo := repositories.NewBillingRepository(db)
	folderRepo := repositories.NewFolderRepository(db)

	// PDF processor & verifier
	pdfProcessor := pdfutils.NewProcessor()
	docVerifier := verification.NewVerifier(cfg.FrontendURL)

	// Services
	authService := services.NewAuthService(userRepo, cfg)
	businessService := services.NewBusinessService(businessRepo)
	customerService := services.NewCustomerService(customerRepo)
	templateService := services.NewTemplateService(templateRepo)
	docService := services.NewDocumentService(docRepo, customerRepo, businessRepo, templateRepo, auditRepo, fileStore, pdfRenderer)
	dashboardService := services.NewDashboardService(docRepo)
	wsService := services.NewWorkspaceService(wsRepo, userRepo)
	sharingService := services.NewSharingService(sharingRepo, docRepo)
	verificationService := services.NewVerificationService(verificationRepo, docRepo, businessRepo, fileStore, docVerifier)
	pdfToolsService := services.NewPDFToolsService(pdfProcessor, fileStore, jobsRepo)
	versionService := services.NewVersionService(versionRepo, docRepo)
	devService := services.NewDeveloperService(devRepo)
	billingService := services.NewBillingService(billingRepo)
	folderService := services.NewFolderService(folderRepo)
	workflowService := services.NewWorkflowService(workflowRepo, docRepo, docService, fileStore, pdfProcessor)
	workflowService.StartScheduler(context.Background())
	_ = workflowService.RecoverOrphanedExecutions(context.Background())

	// Handlers
	authHandler := handlers.NewAuthHandler(authService, userRepo)
	businessHandler := handlers.NewBusinessHandler(businessService)
	customerHandler := handlers.NewCustomerHandler(customerService)
	templateHandler := handlers.NewTemplateHandler(templateService)
	receiptHandler := handlers.NewReceiptHandler(docService)
	invoiceHandler := handlers.NewInvoiceHandler(docService)
	quotationHandler := handlers.NewQuotationHandler(docService)
	estimateHandler := handlers.NewEstimateHandler(docService)
	documentHandler := handlers.NewDocumentHandler(docService)
	dashboardHandler := handlers.NewDashboardHandler(dashboardService)
	healthHandler := handlers.NewHealthHandler(db, fileStore)
	workspaceHandler := handlers.NewWorkspaceHandler(wsService)
	pdfToolsHandler := handlers.NewPDFToolsHandler(pdfToolsService)
	sharingHandler := handlers.NewSharingHandler(sharingService, docService, fileStore)
	verificationHandler := handlers.NewVerificationHandler(verificationService)
	versionHandler := handlers.NewVersionHandler(versionService)
	developerHandler := handlers.NewDeveloperHandler(devService)
	workflowHandler := handlers.NewWorkflowHandler(workflowService)
	billingHandler := handlers.NewBillingHandler(billingService)
	folderHandler := handlers.NewFolderHandler(folderService)

	// Rate limiter (e.g. 60 req/min for auth)
	rateLimiter := middleware.NewRateLimiter(60, time.Minute)

	// Global Middleware
	r.Use(middleware.RequestID())
	r.Use(middleware.StructuredLogger())
	r.Use(middleware.Recovery())
	r.Use(middleware.CORS(cfg.FrontendURL))

	// Health check endpoints (root level for Docker/Nginx probes)
	r.Any("/healthz", healthHandler.Healthz)
	r.Any("/readyz", healthHandler.Readyz)

	// OpenAPI and Swagger UI
	RegisterOpenAPIRoutes(r)

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Health under v1 as well
		v1.GET("/healthz", healthHandler.Healthz)
		v1.GET("/readyz", healthHandler.Readyz)

		// Public unauthenticated verification & sharing routes
		publicGroup := v1.Group("/public")
		{
			publicGroup.GET("/verify/:token", verificationHandler.PublicVerify)
			publicGroup.GET("/share/:token", sharingHandler.GetPublicShareInfo)
			publicGroup.POST("/share/:token/access", sharingHandler.AccessSharedDocument)
			publicGroup.POST("/workflows/webhook/:token", workflowHandler.WebhookTrigger)
		}

		// Auth endpoints (with rate limiting)
		authGroup := v1.Group("/auth")
		authGroup.Use(rateLimiter.Middleware())
		{
			authGroup.POST("/register", authHandler.Register)
			authGroup.POST("/login", authHandler.Login)
			authGroup.POST("/refresh", authHandler.Refresh)
			authGroup.POST("/logout", authHandler.Logout)
			authGroup.GET("/me", middleware.Auth(authService), authHandler.Me)
			authGroup.PUT("/profile", middleware.Auth(authService), authHandler.UpdateProfile)
			authGroup.POST("/change-password", middleware.Auth(authService), authHandler.ChangePassword)
		}

		// Protected endpoints
		protected := v1.Group("")
		protected.Use(middleware.Auth(authService))
		{
			// User Profile alias
			protected.PUT("/users/me", authHandler.UpdateProfile)
			// Dashboard
			protected.GET("/dashboard/stats", dashboardHandler.GetStats)
			protected.GET("/dashboard/recent-documents", dashboardHandler.GetRecentDocuments)

			// Workspaces
			protected.GET("/workspaces", workspaceHandler.List)
			protected.POST("/workspaces", workspaceHandler.Create)
			protected.GET("/workspaces/:id", workspaceHandler.Get)
			protected.GET("/workspaces/:id/members", workspaceHandler.GetMembers)
			protected.POST("/workspaces/:id/members", workspaceHandler.AddMember)
			protected.DELETE("/workspaces/:id/members/:userId", workspaceHandler.RemoveMember)

			// Receipts
			protected.POST("/receipts", receiptHandler.Create)
			protected.GET("/receipts", receiptHandler.List)
			protected.GET("/receipts/:id", receiptHandler.GetByID)
			protected.PUT("/receipts/:id", receiptHandler.Update)
			protected.POST("/receipts/:id/preview", receiptHandler.Preview)
			protected.POST("/receipts/:id/finalize", receiptHandler.Finalize)
			protected.POST("/receipts/:id/cancel", receiptHandler.Cancel)

			// Invoices
			protected.POST("/invoices", invoiceHandler.Create)
			protected.GET("/invoices", invoiceHandler.List)
			protected.GET("/invoices/:id", invoiceHandler.GetByID)
			protected.PUT("/invoices/:id", invoiceHandler.Update)
			protected.POST("/invoices/:id/preview", invoiceHandler.Preview)
			protected.POST("/invoices/:id/finalize", invoiceHandler.Finalize)
			protected.POST("/invoices/:id/cancel", invoiceHandler.Cancel)

			// Quotations
			protected.POST("/quotations", quotationHandler.Create)
			protected.GET("/quotations/:id", quotationHandler.Get)

			// Estimates
			protected.POST("/estimates", estimateHandler.Create)
			protected.GET("/estimates/:id", estimateHandler.Get)

			// PDF Utilities
			protected.POST("/pdf-tools/merge", pdfToolsHandler.Merge)
			protected.POST("/pdf-tools/compress", pdfToolsHandler.Compress)
			protected.POST("/pdf-tools/rotate", pdfToolsHandler.Rotate)
			protected.POST("/pdf-tools/watermark", pdfToolsHandler.Watermark)
			protected.POST("/pdf-tools/page-numbers", pdfToolsHandler.PageNumbers)
			protected.POST("/pdf-tools/images-to-pdf", pdfToolsHandler.ImagesToPDF)
			protected.POST("/pdf-tools/metadata", pdfToolsHandler.Metadata)
			protected.GET("/pdf-tools/jobs", pdfToolsHandler.ListJobs)

			// Secure Sharing
			protected.POST("/documents/:id/share", sharingHandler.Create)
			protected.GET("/shared-links", sharingHandler.List)
			protected.POST("/shared-links/:id/revoke", sharingHandler.Revoke)

			// Cryptographic Verification & Integrity
			protected.GET("/documents/:id/integrity", verificationHandler.CheckIntegrity)

			// Document Version History
			protected.GET("/documents/:id/versions", versionHandler.List)
			protected.POST("/documents/:id/versions", versionHandler.CreateSnapshot)
			protected.POST("/documents/:id/versions/:version/restore", versionHandler.RestoreDraft)

			// Developer API Keys & Webhooks
			protected.GET("/developer/keys", developerHandler.ListKeys)
			protected.POST("/developer/keys", developerHandler.CreateKey)
			protected.DELETE("/developer/keys/:id", developerHandler.RevokeKey)
			protected.GET("/developer/webhooks", developerHandler.ListWebhooks)
			protected.POST("/developer/webhooks", developerHandler.CreateWebhook)
			protected.DELETE("/developer/webhooks/:id", developerHandler.DeleteWebhook)
			protected.GET("/developer/webhooks/:id/deliveries", developerHandler.ListDeliveries)
			protected.POST("/developer/webhooks/:id/test", developerHandler.TestWebhook)

			// Workflow Automation
			protected.GET("/workflows", workflowHandler.List)
			protected.POST("/workflows", workflowHandler.Create)
			protected.GET("/workflows/templates", workflowHandler.GetTemplates)
			protected.GET("/workflows/analytics", workflowHandler.GetAnalytics)
			protected.GET("/workflows/approvals", workflowHandler.ListApprovals)
			protected.POST("/workflows/approvals/:id/decide", workflowHandler.DecideApproval)
			protected.GET("/workflows/executions", workflowHandler.ListExecutions)
			protected.GET("/workflows/executions/:id", workflowHandler.GetExecution)
			protected.POST("/workflows/executions/:id/retry", workflowHandler.RetryExecution)
			protected.POST("/workflows/executions/:id/cancel", workflowHandler.CancelExecution)
			protected.POST("/workflows/test", workflowHandler.DryRun)
			protected.POST("/workflows/import", workflowHandler.Import)
			protected.GET("/workflows/:id", workflowHandler.Get)
			protected.PUT("/workflows/:id", workflowHandler.Update)
			protected.DELETE("/workflows/:id", workflowHandler.Delete)
			protected.POST("/workflows/:id/duplicate", workflowHandler.Duplicate)
			protected.POST("/workflows/:id/trigger", workflowHandler.Trigger)
			protected.POST("/workflows/:id/test", workflowHandler.DryRun)
			protected.POST("/workflows/:id/bulk", workflowHandler.Bulk)
			protected.GET("/workflows/:id/versions", workflowHandler.ListVersions)
			protected.POST("/workflows/:id/versions/:version/restore", workflowHandler.RestoreVersion)
			protected.GET("/workflows/:id/executions", workflowHandler.ListExecutions)
			protected.GET("/workflows/:id/schedule", workflowHandler.GetSchedule)
			protected.POST("/workflows/:id/schedule", workflowHandler.SaveSchedule)
			protected.GET("/workflows/:id/export", workflowHandler.Export)

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

			// SaaS Billing, Plans, and Quotas
			protected.GET("/billing/status", billingHandler.GetStatus)
			protected.GET("/billing/plans", billingHandler.GetPlans)
			protected.POST("/billing/change-plan", billingHandler.ChangePlan)
			protected.GET("/billing/invoices", billingHandler.ListInvoices)

			// Enterprise Document Folders, Tags & Compliance
			protected.GET("/folders", folderHandler.List)
			protected.POST("/folders", folderHandler.Create)
			protected.PUT("/folders/:id", folderHandler.Update)
			protected.DELETE("/folders/:id", folderHandler.Delete)
			protected.POST("/folders/move", folderHandler.Move)
			protected.POST("/folders/tag", folderHandler.Tag)
			protected.POST("/folders/archive", folderHandler.Archive)
			protected.POST("/folders/compliance", folderHandler.Compliance)
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
