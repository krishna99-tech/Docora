#!/usr/bin/env bash
# Docora Production Database Backup Script (Linux / Alpine / Docker)
set -eo pipefail

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-docora}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/docora}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "${BACKUP_DIR}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DUMP_FILE="${BACKUP_DIR}/docora_backup_${TIMESTAMP}.dump"
CHECKSUM_FILE="${BACKUP_DIR}/docora_backup_${TIMESTAMP}.sha256"

echo "=========================================="
echo " Starting Docora Database Backup"
echo " Database: ${DB_NAME} on ${DB_HOST}:${DB_PORT}"
echo " File:     ${DUMP_FILE}"
echo " Date:     $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=========================================="

export PGPASSWORD="${DB_PASSWORD}"

pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -F c -b -v -f "${DUMP_FILE}" "${DB_NAME}"

# Generate SHA-256 Checksum
sha256sum "${DUMP_FILE}" > "${CHECKSUM_FILE}"

echo " Backup successfully created: $(du -h "${DUMP_FILE}" | cut -f1)"
echo " Checksum recorded: $(cat "${CHECKSUM_FILE}")"

# Retention policy: remove backups older than RETENTION_DAYS
echo "Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "docora_backup_*" -mtime +"${RETENTION_DAYS}" -exec rm -f {} \;

echo "Backup complete."
