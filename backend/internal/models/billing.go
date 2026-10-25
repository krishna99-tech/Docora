package models

import (
	"time"

	"github.com/google/uuid"
)

type PlanTier string

const (
	PlanFree       PlanTier = "free"
	PlanStarter    PlanTier = "starter"
	PlanPro        PlanTier = "pro"
	PlanEnterprise PlanTier = "enterprise"
)

type PlanDefinition struct {
	ID             PlanTier `json:"id"`
	Name           string   `json:"name"`
	Description    string   `json:"description"`
	PriceMonthly   int      `json:"priceMonthly"` // in USD
	PriceAnnual    int      `json:"priceAnnual"`
	QuotaDocuments int      `json:"quotaDocuments"` // Monthly allowance (-1 for unlimited)
	QuotaStorageMB int      `json:"quotaStorageMb"` // Storage limit in MB (-1 for unlimited)
	QuotaMembers   int      `json:"quotaMembers"`
	QuotaWorkflows int      `json:"quotaWorkflows"`
	Features       []string `json:"features"`
}

var AvailablePlans = []PlanDefinition{
	{
		ID:             PlanFree,
		Name:           "Free Tier",
		Description:    "For small personal invoicing and lightweight testing.",
		PriceMonthly:   0,
		PriceAnnual:    0,
		QuotaDocuments: 50,
		QuotaStorageMB: 100,
		QuotaMembers:   2,
		QuotaWorkflows: 3,
		Features: []string{
			"50 PDF documents / month",
			"100 MB secure storage",
			"2 workspace members",
			"3 automated workflows",
			"Standard PDF compilation",
			"Public verification links",
		},
	},
	{
		ID:             PlanStarter,
		Name:           "Starter",
		Description:    "Essential tools for growing independent agencies and freelancers.",
		PriceMonthly:   19,
		PriceAnnual:    190,
		QuotaDocuments: 500,
		QuotaStorageMB: 2048,
		QuotaMembers:   5,
		QuotaWorkflows: 15,
		Features: []string{
			"500 PDF documents / month",
			"2 GB cloud storage",
			"5 team members",
			"15 automated workflows",
			"Custom branding & typography",
			"PDF merge, watermark & rotate",
			"Email support",
		},
	},
	{
		ID:             PlanPro,
		Name:           "Professional",
		Description:    "High-volume document generation with advanced automation.",
		PriceMonthly:   49,
		PriceAnnual:    490,
		QuotaDocuments: 3000,
		QuotaStorageMB: 15360,
		QuotaMembers:   20,
		QuotaWorkflows: 50,
		Features: []string{
			"3,000 PDF documents / month",
			"15 GB high-performance storage",
			"20 team members with RBAC",
			"50 automated workflows",
			"Executive approval gates",
			"Developer API & Webhooks",
			"Bulk CSV document processor",
			"Priority 24/7 support",
		},
	},
	{
		ID:             PlanEnterprise,
		Name:           "Enterprise",
		Description:    "Infinite scale, compliance archival, and dedicated SLAs.",
		PriceMonthly:   199,
		PriceAnnual:    1990,
		QuotaDocuments: -1, // Unlimited
		QuotaStorageMB: 102400,
		QuotaMembers:   -1,
		QuotaWorkflows: -1,
		Features: []string{
			"Unlimited monthly documents",
			"100 GB compliant storage",
			"Unlimited team seats",
			"Unlimited parallel workflows",
			"PDF/A legal compliance archival",
			"Custom retention & purge rules",
			"Dedicated SLA & 99.99% uptime",
			"Direct engineering support",
		},
	},
}

type WorkspaceBillingStatus struct {
	WorkspaceID            uuid.UUID  `json:"workspaceId"`
	Plan                   PlanTier   `json:"plan"`
	BillingCycle           string     `json:"billingCycle"`
	SubscriptionStatus     string     `json:"subscriptionStatus"`
	CurrentPeriodEnd       time.Time  `json:"currentPeriodEnd"`
	QuotaDocumentsMonthly  int        `json:"quotaDocumentsMonthly"`
	DocumentsUsedThisMonth int        `json:"documentsUsedThisMonth"`
	QuotaStorageMB         int        `json:"quotaStorageMb"`
	StorageUsedMB          float64    `json:"storageUsedMb"`
	QuotaMembers           int        `json:"quotaMembers"`
	MembersCount           int        `json:"membersCount"`
	QuotaWorkflows         int        `json:"quotaWorkflows"`
	WorkflowsCount         int        `json:"workflowsCount"`
	CanGenerateMoreDocs    bool       `json:"canGenerateMoreDocs"`
}

type WorkspaceInvoice struct {
	ID               uuid.UUID `json:"id" db:"id"`
	WorkspaceID      uuid.UUID `json:"workspaceId" db:"workspace_id"`
	InvoiceNumber    string    `json:"invoiceNumber" db:"invoice_number"`
	Amount           int       `json:"amount" db:"amount"` // in cents
	Currency         string    `json:"currency" db:"currency"`
	Status           string    `json:"status" db:"status"`
	PaidAt           time.Time `json:"paidAt" db:"paid_at"`
	HostedInvoiceURL string    `json:"hostedInvoiceUrl,omitempty" db:"hosted_invoice_url"`
	CreatedAt        time.Time `json:"createdAt" db:"created_at"`
}

type ChangePlanRequest struct {
	Plan         PlanTier `json:"plan" binding:"required"`
	BillingCycle string   `json:"billingCycle" binding:"required"` // monthly or annual
}
