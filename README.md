# Docora — Enterprise Document Automation & SaaS Platform

[![Go Version](https://img.shields.io/badge/Go-1.24+-00ADD8?style=flat&logo=go)](https://golang.org)
[![Next.js](https://img.shields.io/badge/Next.js-16+-black?style=flat&logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat&logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Production%20Ready-2496ED?style=flat&logo=docker)](https://www.docker.com)
[![CI Pipeline](https://img.shields.io/badge/CI-Automated%20Tests%20Passing-success?style=flat&logo=githubactions)](#automated-testing)
[![Design](https://img.shields.io/badge/Theme-Monochrome%20SaaS-111111?style=flat)](#design-system)

Docora is an enterprise-grade document automation SaaS platform engineered for creating, issuing, verifying, managing, and orchestrating professional receipts, commercial invoices, and structured general-purpose PDF documents. Built with a full-stack architecture combining a Next.js 16 App Router frontend, a high-performance Go REST API backend, and PostgreSQL for persistent relational storage.

---

## 1. Core Platform Capabilities

### ⚡ Durable Workflow Automation Engine
- **Directed Graph Execution:** Visual drag-and-drop workflow canvas with cycle detection (3-color DFS graph validation) preventing deadlocks and infinite loops before publication.
- **Conditional & Parallel Routing:** Dynamic `If / Else` branching based on execution context fields, parallel execution forks running concurrently across worker goroutines.
- **Human-in-the-Loop Approvals:** Workflows pause in `WAITING_APPROVAL` status until an authorized workspace member reviews and approves or rejects the document. Upon approval, downstream edges resume automatically.
- **Fault-Tolerant Retries:** Configurable exponential backoff retries with jitter for transient failures, distinguishing permanent client errors from network/worker timeouts.
- **Immutable Version Pinning:** Every execution snapshots the workflow version and definition at trigger time, preventing in-flight execution drift during workflow edits.
- **Server Reboot Recovery:** The engine automatically reconciles orphaned jobs upon server reboot via `RecoverOrphanedExecutions()`.

### 💳 SaaS Plans, Billing & Resource Quotas
- **Tiered Subscriptions:** Built-in support for **Free**, **Starter** ($19/mo), **Professional** ($49/mo), and **Enterprise** ($199/mo) plans.
- **Automated Quota Enforcement:** Real-time tracking of monthly document generation limits, cloud storage footprint (MB), active team seats, and parallel workflows.
- **Annual Savings & Plan Upgrades:** Monthly and annual billing cycles with 20% discounts and immediate prorated tier transitions.
- **Invoice Audit Trail:** Automatic generation of payment receipts and downloadable billing history.

### 📁 Enterprise Document Management
- **Hierarchical Folders & Tags:** Organize receipts and commercial invoices into nested folders with custom color-coded badges and document counters.
- **Batch Actions:** Move, tag, and archive multiple documents in bulk.
- **Compliance & Retention Policies:** Support for legal compliance standards (Standard, PDF/A-1b, PDF/A-2b) and automated retention expiry dating.
- **Cryptographic Document Verification:** Public unauthenticated verification links (`/verify/[token]`) with SHA-256 HMAC integrity checks and QR code metadata.
- **Secure Document Sharing:** Password-protected public share links with expiration timestamps and one-click revocation.

### 🛠️ Developer Platform & Webhooks
- **Scoped API Keys:** Hashed API keys with granular permissions (`documents:read`, `documents:write`, `workflows:execute`) displayed once upon generation.
- **Event Webhooks:** Workspace admins can subscribe to lifecycle events (`document.finalized`, `workflow.completed`) with HMAC SHA-256 signatures, automated delivery logging, and manual test event runners.

### 📊 Observability & System Reliability
- **Real-Time Telemetry Dashboard (`/analytics`):** Document volume throughput, workflow duration tracking (ms), success/failure rates, and storage consumption.
- **Standard Health Probes:** Kubernetes and Docker-compatible `/api/v1/healthz` (liveness) and `/api/v1/readyz` (readiness with database & storage checks).
- **Comprehensive Error Routing:** Dedicated user-friendly error pages for `401`, `403`, `404`, `408`, `429`, `500`, `503`, `/maintenance`, and `/network-error`.
- **Cross-Browser PDF Preview:** Robust multi-tier `<object>` and `<embed>` fallback handling for Brave Shields and restrictive browser plugin sandbox policies.

---

## 2. System Architecture

```text
                                Web Browser (Chrome, Brave, Edge, Safari)
                                                   |
                                                   v
                                          Nginx Reverse Proxy (:80)
                                                   |
                               +-------------------+-------------------+
                               |                                       |
                               v                                       v
                    Next.js Frontend (:3005)               Go REST API Server (:8087)
                    (Turbopack, App Router)                            |
                                               +-----------------------+-----------------------+
                                               |                       |                       |
                                               v                       v                       v
                                        Authentication            Workflow Engine         Billing & Quotas
                                        (JWT / API Keys)          (DAG / Retries)         (Tiers / Storage)
                                               |                       |                       |
                                               +-----------------------+-----------------------+
                                                                       |
                                                                       v
                                                           PostgreSQL 16 (:5432)
                                                         (4 Versioned Migrations)
                                                                       |
                                                                       v
                                                           Persistent File Storage
                                                            (/app/storage volumes)
```

---

## 3. Technology Stack

### Frontend
- **Framework**: Next.js 16 (Turbopack, App Router), React 19, TypeScript strict mode.
- **State & Data Fetching**: TanStack Query (React Query v5).
- **Styling**: Tailwind CSS with semantic monochrome tokens (`--foreground`, `--background`, `--border`).
- **Icons**: Lucide React.
- **PDF Renderer**: Multi-layer PDF preview with Brave Shields detection and fallback viewer.

### Backend
- **Language**: Go (Golang 1.24+).
- **HTTP Routing**: Gin Web Framework.
- **Database Driver**: `pgx/v5` with connection pooling (`pgxpool`).
- **PDF Engine**: Pure Go CDP client (`chromedp`) with headless Chromium and custom fallback rasterizer.
- **Auth & Security**: Argon2id password hashing, HMAC-SHA256 JWTs with rotating refresh tokens, IP sliding-window rate limiting.

### Infrastructure & Deployment
- **Containerization**: Multi-stage Docker builds for Alpine Linux.
- **Orchestration**: Docker Compose with health-checked service dependencies.
- **Reverse Proxy**: Nginx with SSL termination and Gzip/Brotli compression.

---

## 4. Repository Structure

```text
Docora/
├── backend/
│   ├── cmd/api/main.go               # Go entry point
│   ├── internal/
│   │   ├── config/config.go          # Environment configuration
│   │   ├── handlers/                 # HTTP Gin request handlers (Auth, Workflows, Billing, Folders, etc.)
│   │   ├── middleware/               # Auth, CORS, Logger, Rate-limit, Panic Recovery
│   │   ├── models/                   # Domain entities (Workflow, Billing, Folder, Document, etc.)
│   │   ├── pdf/ & pdfutils/          # Chromedp PDF engine, templates & PDF manipulation
│   │   ├── repositories/             # PostgreSQL pgx queries, migrations & transactions
│   │   ├── server/                   # Server routing & graceful shutdown
│   │   ├── services/                 # Workflow engine, Billing, Documents, Workspaces
│   │   ├── storage/                  # Local storage driver with atomic writes & path safety
│   │   └── verification/             # SHA-256 HMAC cryptographic token generator
│   ├── migrations/                   # 000001 through 000006 versioned SQL migrations
│   ├── tests/                        # 12 unit/integration test suites
│   └── Dockerfile                    # Multi-stage Alpine container with Chromium & fonts
├── frontend/
│   ├── src/
│   │   ├── app/                      # Next.js App Router (42 static & dynamic routes)
│   │   │   ├── (app)/                # Workflows, Studio, Documents, Analytics, Settings, Bulk
│   │   │   ├── (public)/             # 401..503 error pages, /verify/[token], /share/[token]
│   │   │   ├── layout.tsx, providers.tsx, globals.css
│   │   ├── components/               # Workflow canvas, PDF preview renderer, Workspace selector
│   │   ├── lib/api.ts                # Centralized typed API client
│   │   └── types/index.ts            # TypeScript interface definitions
│   └── Dockerfile                    # Multi-stage Node.js container
├── deploy/
│   ├── nginx/nginx.conf              # Reverse proxy configuration
│   ├── scripts/                      # Automated backup and restore scripts (bash & PowerShell)
│   └── DISASTER_RECOVERY.md          # Production DR runbook & PITR procedures
├── .github/workflows/ci.yml          # GitHub Actions automated test & build workflow
├── docker-compose.yml                # Production orchestration
└── README.md
```

---

## 5. Quickstart & Local Installation

### Prerequisites
- **Docker & Docker Compose** (Recommended), OR
- **Go 1.24+**, **Node.js 20+**, and **PostgreSQL 16+** running locally.

### Option A: Launching via Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/Docora.git
   cd Docora
   ```

2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Start all services:
   ```bash
   docker compose up --build -d
   ```

4. Verify service health:
   ```bash
   docker compose ps
   ```

5. Access the applications:
   - **Web Application**: `http://localhost:3005` (or `http://localhost:9091` via Nginx)
   - **Backend API**: `http://localhost:8087/api/v1`
   - **Health Probe**: `http://localhost:8087/healthz`
   - **Readiness Probe**: `http://localhost:8087/readyz`

---

### Option B: Running Locally on Host

#### 1. Setup Local PostgreSQL Database
```bash
createdb -U postgres docora_db
```

#### 2. Start Go Backend
```bash
cd backend
go run ./cmd/api
```
*Note: Pending database migrations automatically execute on server startup.*

#### 3. Start Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3005` in your browser.

---

## 6. Updating Deployed Instances (CentOS / Docker)

To update a live CentOS server running Docora via Docker:

```bash
# 1. Take a safety snapshot of the live database
docker exec -t docora_postgres pg_dump -U docora_user -d docora_db > pre_update_backup_$(date +%F).sql

# 2. Pull latest code
git pull origin main

# 3. Rebuild and restart containers
docker compose build --no-cache backend frontend
docker compose up -d --remove-orphans

# 4. Check backend migration logs and health
docker logs --tail 30 docora_backend
curl -s http://127.0.0.1:8087/readyz
```

---

## 7. Automated Testing & Verification

Run the automated Go backend test suite:
```bash
cd backend
go test -v ./tests/...
```

Test coverage includes:
- **Graph Cycle Detection:** Validates 3-color DFS traversal against self-loops and multi-node cycles.
- **Node-Level Validation:** Verifies condition operators, required field presence, and timeout bounds.
- **Execution Version Pinning:** Ensures executing workflows snapshot their definition and version at runtime.
- **Dry-Run Engine Simulation:** Simulates branching paths without side effects.
- **Monetary Arithmetic:** Checks minor-unit integer financial calculations without floating point errors.
- **Storage & Path Safety:** Verifies atomic writes and directory traversal prevention.

Run frontend TypeScript verification and production build:
```bash
cd frontend
npx tsc --noEmit
npm run build
```

---

## 8. Disaster Recovery & Backup Procedures

Automated production backup and restoration scripts are located in `deploy/scripts/`:

- **Automated Backup (Linux / Cron):**
  ```bash
  ./deploy/scripts/backup_db.sh
  ```
  Generates a compressed `.dump` archive, computes a `.sha256` checksum, and prunes backups older than 30 days.

- **Automated Backup (Windows / PowerShell):**
  ```powershell
  .\deploy\scripts\backup_db.ps1
  ```

- **Disaster Recovery Restore:**
  ```bash
  ./deploy/scripts/restore_db.sh /var/backups/docora/docora_backup_latest.dump
  ```

For full Point-In-Time Recovery (PITR) procedures, RTO/RPO targets, and failover runbooks, see [deploy/DISASTER_RECOVERY.md](deploy/DISASTER_RECOVERY.md).

---

## 9. License & Maintenance

Docora is maintained under the proprietary enterprise license. Built for high-volume, mission-critical document infrastructure.
