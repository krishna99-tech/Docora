#!/usr/bin/env bash
# Docora Production Database Disaster Recovery & Restore Script
set -eo pipefail

BACKUP_FILE="$1"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-docora}"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <path_to_backup_file.dump>"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file '${BACKUP_FILE}' not found."
  exit 1
fi

CHECKSUM_FILE="${BACKUP_FILE%.*}.sha256"
if [ -f "${CHECKSUM_FILE}" ]; then
  echo "Verifying SHA-256 integrity..."
  sha256sum -c "${CHECKSUM_FILE}" || { echo "Checksum verification failed! Aborting restore."; exit 1; }
  echo " Checksum verified."
else
  echo "Warning: No checksum file found. Proceeding with unverified restore."
fi

echo "=========================================="
echo " Restoring Database: ${DB_NAME}"
echo " Source File:       ${BACKUP_FILE}"
echo " Target Host:       ${DB_HOST}:${DB_PORT}"
echo "=========================================="

export PGPASSWORD="${DB_PASSWORD}"

# Drop existing connections and restore
pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists -v "${BACKUP_FILE}"

echo " Database restore completed successfully."
