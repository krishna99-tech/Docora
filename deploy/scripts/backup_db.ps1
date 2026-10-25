# Docora Production Database Backup Script (PowerShell / Windows / Container)
param (
    [string]$DbHost = $env:DB_HOST,
    [string]$DbPort = $env:DB_PORT,
    [string]$DbUser = $env:DB_USER,
    [string]$DbName = $env:DB_NAME,
    [string]$BackupDir = "c:\Users\vakav\Documents\Docora\backups",
    [int]$RetentionDays = 30
)

if (-not $DbHost) { $DbHost = "localhost" }
if (-not $DbPort) { $DbPort = "5432" }
if (-not $DbUser) { $DbUser = "postgres" }
if (-not $DbName) { $DbName = "docora" }

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dumpFile = Join-Path $BackupDir "docora_backup_$timestamp.sql.gz"
$checksumFile = Join-Path $BackupDir "docora_backup_$timestamp.sha256"

Write-Host "=========================================="
Write-Host " Starting Docora Database Backup"
Write-Host " Database: $DbName on $DbHost:$DbPort"
Write-Host " Output:   $dumpFile"
Write-Host " Time:     $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "=========================================="

try {
    # Execute pg_dump and pipe to gzip if pg_dump is available
    $env:PGPASSWORD = $env:DB_PASSWORD
    & pg_dump -h $DbHost -p $DbPort -U $DbUser -F c -b -v -f $dumpFile $DbName
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path $dumpFile)) {
        $hash = (Get-FileHash -Path $dumpFile -Algorithm SHA256).Hash
        "$hash  $(Split-Path $dumpFile -Leaf)" | Out-File -FilePath $checksumFile -Encoding utf8
        
        $sizeBytes = (Get-Item $dumpFile).Length
        $sizeMB = [math]::Round($sizeBytes / 1MB, 2)
        Write-Host " Backup successful! Size: $sizeMB MB"
        Write-Host " SHA256 Checksum: $hash"
    } else {
        Write-Error "pg_dump failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Error "Backup process error: $_"
}

# Retention Pruning: Delete backups older than $RetentionDays
Write-Host "Pruning backups older than $RetentionDays days..."
$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "docora_backup_*" | Where-Object { $_.LastWriteTime -lt $cutoff } | Remove-Item -Force
Write-Host "Backup procedure finished."
