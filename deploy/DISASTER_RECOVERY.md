# Docora Production Disaster Recovery (DR) & Business Continuity Runbook

## 1. Objectives & SLAs

| Metric | Target SLA | Description |
| :--- | :--- | :--- |
| **RPO (Recovery Point Objective)** | **< 1 hour** | Maximum acceptable data loss period in disaster events |
| **RTO (Recovery Time Objective)** | **< 30 minutes** | Maximum allowable downtime before full service resumption |
| **Uptime Target** | **99.95%** | Measured monthly across API and document verification |

---

## 2. Backup Strategy

### Automated Snapshots & Archival
- **Frequency:** Automated cron execution runs `deploy/scripts/backup_db.sh` hourly into local `/var/backups/docora`.
- **Offsite Replication:** Local dump files are synced to an encrypted cloud object bucket (AWS S3 / GCP Cloud Storage with SSE-KMS enabled).
- **Integrity Validation:** Every backup generates a matching `.sha256` checksum.
- **Retention Schedule:**
  - Hourly snapshots retained for **7 days**.
  - Daily snapshots retained for **30 days**.
  - Monthly compliance archives retained for **7 years** (WORM immutable storage).

---

## 3. Disaster Recovery Procedures

### Scenario A: Full Database Crash / Corrupted Instance

1. **Provision Fresh PostgreSQL Instance:**
   ```bash
   docker run -d --name docora-postgres-dr \
     -e POSTGRES_DB=docora \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=your_secure_password \
     -p 5432:5432 \
     postgres:16-alpine
   ```

2. **Retrieve Latest Valid Snapshot:**
   Download the most recent verified `.dump` and `.sha256` file from offsite S3:
   ```bash
   aws s3 cp s3://docora-backups-dr/latest/docora_backup_latest.dump ./
   aws s3 cp s3://docora-backups-dr/latest/docora_backup_latest.sha256 ./
   ```

3. **Execute Automated DR Restore:**
   ```bash
   chmod +x deploy/scripts/restore_db.sh
   ./deploy/scripts/restore_db.sh ./docora_backup_latest.dump
   ```

4. **Verify Database Integrity:**
   ```sql
   SELECT COUNT(*) FROM workspaces;
   SELECT COUNT(*) FROM documents;
   SELECT COUNT(*) FROM workflows;
   ```

5. **Start API Server with Reboot Reconciliation:**
   When the Go backend launches, `workflowService.RecoverOrphanedExecutions()` automatically marks in-flight workflows that were interrupted as recoverable.

---

### Scenario B: Point-In-Time Recovery (PITR) via WAL Logs

For restoring to a specific second before a catastrophic user error:

1. **Stop Postgres Service:**
   ```bash
   systemctl stop postgresql-16
   ```
2. **Restore Base Backup:**
   Extract base backup into `$PGDATA`.
3. **Configure `recovery.signal` & `postgresql.conf`:**
   ```conf
   restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
   recovery_target_time = '2026-10-25 14:30:00 UTC'
   recovery_target_action = 'promote'
   ```
4. **Touch signal file & start Postgres:**
   ```bash
   touch $PGDATA/recovery.signal
   systemctl start postgresql-16
   ```

---

## 4. Health Probes & Monitoring

The Docora Go backend provides standard Kubernetes/Docker liveness and readiness endpoints:

- **Liveness Probe:** `GET /api/v1/healthz`
  - Validates basic HTTP process responsiveness.
  - Recommended interval: 10s, timeout: 3s.
- **Readiness Probe:** `GET /api/v1/readyz`
  - Verifies active database connection pool and local file storage writeability.
  - Recommended interval: 15s, failureThreshold: 3.

---

## 5. DR Drill Schedule

- **Simulated Recovery Drill:** Conducted quarterly on a dedicated staging sandbox.
- **Verification:** Spin up clean infrastructure from scratch, run `restore_db.sh`, verify all 12 backend test suites pass, and confirm Next.js frontend connects without 500 errors.
