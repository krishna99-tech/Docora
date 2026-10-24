package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const OpenAPISpec = `{
  "openapi": "3.0.3",
  "info": {
    "title": "Docora - Professional Receipt & PDF Generator API",
    "version": "1.0.0",
    "description": "Production REST API for generating receipts, invoices, and general PDFs."
  },
  "servers": [
    {
      "url": "/api/v1",
      "description": "API v1 Endpoint"
    }
  ],
  "components": {
    "securitySchemes": {
      "BearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  },
  "paths": {
    "/auth/register": {
      "post": {
        "summary": "Register a new user",
        "tags": ["Auth"],
        "responses": {
          "201": { "description": "Account registered successfully" },
          "400": { "description": "Invalid input" },
          "409": { "description": "Email already exists" }
        }
      }
    },
    "/auth/login": {
      "post": {
        "summary": "Authenticate user",
        "tags": ["Auth"],
        "responses": {
          "200": { "description": "Tokens issued" },
          "401": { "description": "Invalid credentials" }
        }
      }
    },
    "/auth/refresh": {
      "post": {
        "summary": "Rotate refresh token and issue new access token",
        "tags": ["Auth"],
        "responses": {
          "200": { "description": "New tokens" }
        }
      }
    },
    "/auth/logout": {
      "post": {
        "summary": "Revoke active session",
        "tags": ["Auth"],
        "responses": {
          "200": { "description": "Logged out" }
        }
      }
    },
    "/auth/me": {
      "get": {
        "summary": "Get current user profile",
        "security": [{ "BearerAuth": [] }],
        "tags": ["Auth"],
        "responses": {
          "200": { "description": "User profile" }
        }
      }
    },
    "/dashboard/stats": {
      "get": {
        "summary": "Get aggregated dashboard statistics",
        "security": [{ "BearerAuth": [] }],
        "tags": ["Dashboard"],
        "responses": {
          "200": { "description": "Dashboard metrics" }
        }
      }
    },
    "/receipts": {
      "post": {
        "summary": "Create a new receipt draft",
        "security": [{ "BearerAuth": [] }],
        "tags": ["Receipts"],
        "responses": { "201": { "description": "Receipt created" } }
      },
      "get": {
        "summary": "List receipts with filtering and pagination",
        "security": [{ "BearerAuth": [] }],
        "tags": ["Receipts"],
        "responses": { "200": { "description": "Receipt list" } }
      }
    },
    "/receipts/{id}": {
      "get": {
        "summary": "Get receipt details",
        "security": [{ "BearerAuth": [] }],
        "tags": ["Receipts"],
        "responses": { "200": { "description": "Receipt details" } }
      }
    },
    "/receipts/{id}/preview": {
      "post": {
        "summary": "Generate on-the-fly PDF preview",
        "security": [{ "BearerAuth": [] }],
        "tags": ["Receipts"],
        "responses": { "200": { "description": "PDF binary stream" } }
      }
    },
    "/receipts/{id}/finalize": {
      "post": {
        "summary": "Finalize receipt, persist PDF file, and lock document",
        "security": [{ "BearerAuth": [] }],
        "tags": ["Receipts"],
        "responses": { "200": { "description": "Finalized document" } }
      }
    },
    "/receipts/{id}/cancel": {
      "post": {
        "summary": "Cancel eligible receipt",
        "security": [{ "BearerAuth": [] }],
        "tags": ["Receipts"],
        "responses": { "200": { "description": "Receipt cancelled" } }
      }
    },
    "/invoices": {
      "post": {
        "summary": "Create a new invoice draft",
        "security": [{ "BearerAuth": [] }],
        "tags": ["Invoices"],
        "responses": { "201": { "description": "Invoice created" } }
      },
      "get": {
        "summary": "List invoices",
        "security": [{ "BearerAuth": [] }],
        "tags": ["Invoices"],
        "responses": { "200": { "description": "Invoice list" } }
      }
    },
    "/documents": {
      "get": {
        "summary": "Unified document library listing",
        "security": [{ "BearerAuth": [] }],
        "tags": ["Documents"],
        "responses": { "200": { "description": "Document list" } }
      }
    },
    "/documents/{id}/download": {
      "get": {
        "summary": "Authorized download of PDF file",
        "security": [{ "BearerAuth": [] }],
        "tags": ["Documents"],
        "responses": { "200": { "description": "PDF attachment" } }
      }
    },
    "/customers": {
      "get": {
        "summary": "List customers",
        "security": [{ "BearerAuth": [] }],
        "tags": ["Customers"],
        "responses": { "200": { "description": "Customer list" } }
      },
      "post": {
        "summary": "Create customer",
        "security": [{ "BearerAuth": [] }],
        "tags": ["Customers"],
        "responses": { "201": { "description": "Customer created" } }
      }
    },
    "/business-profile": {
      "get": {
        "summary": "Get business settings",
        "security": [{ "BearerAuth": [] }],
        "tags": ["Business Profile"],
        "responses": { "200": { "description": "Profile data" } }
      },
      "put": {
        "summary": "Update business settings",
        "security": [{ "BearerAuth": [] }],
        "tags": ["Business Profile"],
        "responses": { "200": { "description": "Updated profile" } }
      }
    }
  }
}`

func RegisterOpenAPIRoutes(r *gin.Engine) {
	r.GET("/swagger/doc.json", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.String(http.StatusOK, OpenAPISpec)
	})

	r.GET("/swagger", func(c *gin.Context) {
		html := `<!DOCTYPE html>
<html>
<head>
  <title>Docora API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body style="margin:0;background:#fafafa;">
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/swagger/doc.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis],
      layout: "BaseLayout"
    });
  </script>
</body>
</html>`
		c.Header("Content-Type", "text/html")
		c.String(http.StatusOK, html)
	})
}
