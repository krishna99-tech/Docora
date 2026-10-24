# Docora — Professional Receipt & PDF Generator Platform

[![Go Version](https://img.shields.io/badge/Go-1.24+-00ADD8?style=flat&logo=go)](https://golang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat&logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat&logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com)
[![Design](https://img.shields.io/badge/Theme-Monochrome%20SaaS-111111?style=flat)](#design-system)

Docora is an enterprise-grade, production-oriented web platform engineered for creating, issuing, previewing, and downloading professional receipts, invoices, and structured general-purpose PDF documents. Built with a full-stack architecture combining a Next.js App Router frontend, a high-performance Go REST API backend, and PostgreSQL for persistent relational storage.

---

## 1. Primary Objectives & Features

- **Automated Receipt Generation**: Issue official receipts with authoritative integer minor-unit monetary calculations, taxes, discounts, payment method verification, and balance tracking.
- **Commercial Invoices**: Create B2B itemized invoices with payment terms, due dates, statuses (`draft`, `issued`, `partially_paid`, `paid`, `overdue`, `cancelled`).
- **Structured General PDF Generator**: Dynamic multi-section PDF document builder supporting headings, paragraphs, formatted tables, key-value grids, custom page sizes (A4, A5, Letter), orientations, and margins.
- **Concurrency-Safe Document Numbering**: Transaction-safe monotonic sequences per user and document type (`REC-00001`, `INV-00001`, `DOC-00001`) with unique database constraints.
- **Headless Chromium PDF Rendering Engine**: Pixel-perfect HTML/CSS compilation to PDF via pure Go CDP client with Unicode fonts, page breaks, and print headers/footers.
- **Document History & Audit Trail**: Status changes and file generation events recorded in PostgreSQL audit logs.
- **Persistent Local File Storage**: Separate persistent volume storage for PDFs with SHA-256 integrity checksums and atomic writes.
- **Customer Directory**: Manage clients, contact info, and billing addresses for recurring documents.
- **Reusable Templates**: Customizable layout presets (Simple Receipt, Professional Receipt, Minimal Invoice, Professional Invoice, General Report) with cloning and versioning.
- **Restrained Monochrome Design System**: Black-and-white SaaS interface with persistent light/dark mode support.
- **Docker Compose Ready**: Multi-stage Docker builds with Nginx reverse proxy, healthchecks, and isolated network.
- **Strictly No Email Service**: As mandated, no email delivery, SMTP, or email microservices are implemented.

---

## 2. System Architecture

```text
                    Web Browser
                         |
                         v
                  Nginx Reverse Proxy (:80)
                         |
              +----------+----------+
              |                     |
              v                     v
     Next.js Frontend (:3005)   Go REST API (:8086)
                                    |
                +-------------------+------------------+
                |                   |                  |
                v                   v                  v
          Authentication       Business Logic     PDF Engine (Chromedp)
                                    |                  |
                                    v                  v
                           PostgreSQL (:5432)     Local File Storage
                                    |                  |
                                    v                  v
                             Document Metadata    Persistent PDFs
```

---

## 3. Technology Stack

### Frontend
- **Framework**: Next.js (App Router), React, TypeScript.
- **Styling**: Tailwind CSS with custom semantic monochrome tokens.
- **Icons**: Lucide React.
- **Data Fetching**: TanStack Query (React Query).
- **Forms & Validation**: React Hook Form, Zod.
- **PDF Viewing**: Embedded PDF viewer modal with download and print actions.

### Backend
- **Language**: Go (Golang 1.24+).
- **Framework**: Gin Web Framework.
- **Database Driver**: `pgx/v5` with connection pooling (`pgxpool`).
- **PDF Engine**: `chromedp` (headless Chromium) with fallback generator.
- **Authentication**: JWT tokens (HMAC-SHA256) with rotating refresh tokens stored as SHA-256 hashes.
- **Security**: Argon2id / bcrypt password hashing, IP-based sliding-window rate limiting, structured panic recovery, ownership isolation.
- **API Documentation**: Interactive OpenAPI 3.0 / Swagger UI.

### Database & Storage
- **Database**: PostgreSQL 16 Alpine with versioned SQL migrations (`pgcrypto`).
- **Storage**: Abstracted storage interface with local filesystem implementation (atomic writes, path-traversal prevention, SHA-256 verification).

---

## 4. Repository Structure

```text
Docora/
├── backend/
│   ├── cmd/api/main.go               # Backend entry point
│   ├── internal/
│   │   ├── config/config.go          # Environment configuration
│   │   ├── handlers/                 # HTTP Gin request handlers
│   │   ├── middleware/               # Auth, CORS, Logger, Rate-limit, Recovery
│   │   ├── models/                   # Domain entities and request DTOs
│   │   ├── pdf/                      # Chromedp PDF engine & HTML print templates
│   │   ├── repositories/             # PostgreSQL pgx queries & transactions
│   │   ├── server/                   # Server setup & OpenAPI documentation
│   │   ├── services/                 # Authoritative monetary calculations & business logic
│   │   └── storage/                  # Local storage driver & S3 adapter
│   ├── migrations/                   # SQL migration scripts
│   ├── tests/                        # Unit tests for calculations, storage, and auth
│   ├── Dockerfile                    # Multi-stage Alpine container with Chromium
│   ├── go.mod / go.sum
├── frontend/
│   ├── src/
│   │   ├── app/                      # Next.js App Router routes
│   │   │   ├── (auth)/login, register
│   │   │   ├── (app)/dashboard, receipts, invoices, pdf-generator, documents, templates, customers, settings
│   │   │   ├── globals.css           # Design tokens & color variables
│   │   │   ├── layout.tsx, providers.tsx
│   │   ├── components/ui, layout, pdf
│   │   ├── lib/api.ts, utils.ts
│   │   └── types/index.ts
│   ├── Dockerfile
│   └── package.json
├── deploy/nginx/nginx.conf           # Reverse proxy configuration
├── docker-compose.yml                # Multi-container orchestration
├── .env.example                      # Documented environment variables
├── .gitignore
└── README.md
```

---

## 5. Design System

The platform strictly uses a high-contrast black-and-white theme.

### Semantic Color Tokens

| Token | Light Mode | Dark Mode |
| :--- | :--- | :--- |
| `--background` | `#ffffff` | `#0a0a0a` |
| `--foreground` | `#111111` | `#fafafa` |
| `--surface` | `#ffffff` | `#111111` |
| `--surface-secondary`| `#f7f7f7` | `#171717` |
| `--surface-hover` | `#f1f1f1` | `#262626` |
| `--border` | `#e5e5e5` | `#292929` |
| `--border-strong` | `#c9c9c9` | `#404040` |
| `--primary` | `#111111` | `#ffffff` |
| `--primary-foreground`| `#ffffff` | `#111111` |
| `--muted-foreground` | `#737373` | `#a3a3a3` |

---

## 6. Getting Started & Installation

### Option A: Running with Docker Compose (Recommended)

1. Clone or navigate to the project directory:
   ```bash
   cd Docora
   ```

2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Build and launch all services:
   ```bash
   docker compose up --build -d
   ```

4. Verify service health:
   ```bash
   docker compose ps
   ```

5. Access the application:
   - **Frontend Application**: `http://localhost:3005` (or `http://localhost` via Nginx)
   - **Go Backend API**: `http://localhost:8086/api/v1` (or `http://localhost/api/v1` via Nginx)
   - **Swagger / OpenAPI Documentation**: `http://localhost:8086/swagger` (or `http://localhost/swagger`)
   - **Healthcheck Endpoint**: `http://localhost:8086/healthz`
   - **Readiness Probe**: `http://localhost:8086/readyz`

---

### Option B: Running Locally on Host

#### Prerequisites
- Go 1.24+
- Node.js 20+ and npm 10+
- PostgreSQL 14+ running locally

#### 1. Setup Database
```bash
createdb -U postgres docora_db
```

#### 2. Start Go Backend
```bash
cd backend
go mod download
go test ./tests/... -v
go run ./cmd/api/main.go
```
The backend starts on `http://localhost:8086`.

#### 3. Start Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:3005`.

---

## 7. REST API Reference

All API routes are prefixed with `/api/v1`.

### Authentication
- `POST /api/v1/auth/register` — Create user account
- `POST /api/v1/auth/login` — Authenticate and receive JWT + Refresh Token
- `POST /api/v1/auth/refresh` — Rotate refresh token and issue new access token
- `POST /api/v1/auth/logout` — Revoke active session
- `GET  /api/v1/auth/me` — Get current user profile

### Dashboard
- `GET /api/v1/dashboard/stats` — Metrics (total documents, revenue minor, pending amounts)
- `GET /api/v1/dashboard/recent-documents` — Most recent receipts and invoices

### Receipts
- `POST /api/v1/receipts` — Create a receipt draft
- `GET  /api/v1/receipts` — List receipts with search, status filters, and pagination
- `GET  /api/v1/receipts/:id` — Get receipt details with line items
- `POST /api/v1/receipts/:id/preview` — Generate on-the-fly PDF stream
- `POST /api/v1/receipts/:id/finalize` — Finalize receipt, generate and persist PDF file
- `POST /api/v1/receipts/:id/cancel` — Void/cancel eligible receipt

### Invoices
- `POST /api/v1/invoices` — Create an invoice draft
- `GET  /api/v1/invoices` — List invoices
- `GET  /api/v1/invoices/:id` — Get invoice details
- `POST /api/v1/invoices/:id/preview` — Generate PDF preview
- `POST /api/v1/invoices/:id/finalize` — Issue invoice
- `POST /api/v1/invoices/:id/cancel` — Cancel invoice

### Unified Document Library
- `GET    /api/v1/documents` — Search across all document types
- `GET    /api/v1/documents/:id` — Document metadata
- `GET    /api/v1/documents/:id/preview` — Live PDF preview
- `GET    /api/v1/documents/:id/download` — Authorized attachment download
- `DELETE /api/v1/documents/:id` — Delete eligible draft documents

### General PDF Generator
- `POST /api/v1/pdf-generator/generate` — Compile custom multi-section PDF (headings, paragraphs, tables, key-values)

### Templates
- `GET    /api/v1/templates` — List available templates
- `POST   /api/v1/templates` — Create custom template
- `GET    /api/v1/templates/:id` — Template details
- `PUT    /api/v1/templates/:id` — Update template
- `POST   /api/v1/templates/:id/duplicate` — Duplicate template
- `DELETE /api/v1/templates/:id` — Delete custom template

### Customers
- `GET    /api/v1/customers` — List customers
- `POST   /api/v1/customers` — Create customer
- `GET    /api/v1/customers/:id` — Customer details
- `PUT    /api/v1/customers/:id` — Update customer
- `DELETE /api/v1/customers/:id` — Delete customer

### Business Profile & Settings
- `GET /api/v1/business-profile` — Fetch business header settings
- `PUT /api/v1/business-profile` — Update business name, address, tax ID, currency

---

## 8. Automated Testing

Run the automated Go backend test suite:
```bash
cd backend
go test ./tests/... -v
```

Tests verify:
- Authoritative integer minor unit arithmetic (subtotals, line discounts, proportional taxes, balance due).
- Local storage atomic writes and path-traversal injection prevention.
- Cryptographic SHA-256 integrity checksum calculation.
- Fallback PDF generation when headless browser is in sandbox mode.
- JWT validation and expiry handling.

---

## 9. Security Principles

- **No Public Database Exposure**: PostgreSQL is confined within the internal Docker bridge network.
- **Server-Side Authoritative Totals**: The client never calculates authoritative financial totals; all minor unit arithmetic is executed in Go.
- **Resource Sanitization**: Chromium execution restricts network access and external resource loading.
- **Secure File Keys**: Storage keys are generated server-side using UUIDs and sanitized paths.
- **Ownership Verification**: All database queries enforce `user_id` ownership filters to prevent IDOR attacks.
