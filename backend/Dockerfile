# Build stage
FROM golang:alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o /app/api ./cmd/api

# Runtime stage
FROM alpine:3.20

WORKDIR /app

# Install Chromium and standard Unicode fonts for pixel-perfect PDF rendering
RUN apk add --no-cache \
    chromium \
    font-noto \
    font-noto-cjk \
    font-noto-extra \
    ca-certificates \
    tzdata \
    wget \
    su-exec

# Create unprivileged user
RUN addgroup -S docora && adduser -S docora -G docora

# Copy compiled binary and migrations
COPY --from=builder /app/api /app/api
COPY --from=builder /app/migrations /app/migrations

# Setup storage directory with appropriate ownership
RUN mkdir -p /app/storage && chown -R docora:docora /app

ENV APP_ENV=production \
    APP_PORT=8086 \
    CHROME_BIN=/usr/bin/chromium-browser \
    DOCUMENT_STORAGE_PATH=/app/storage

USER docora

EXPOSE 8086

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8086/healthz || exit 1

CMD ["/app/api"]
