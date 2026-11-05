# Docora Production Database Backup Script (PowerShell / Windows / Container)
param (
    [string]$ContainerName = "docora_postgres",
    [string]$DbHost = $env:DB_HOST,
    [string]$DbPort = $env:DB_PORT,
    [string]$DbUser = $env:DB_USER,
    [string]$DbName = $env:DB_NAME,
    [string]$BackupDir = "c:\Users\vakav\Documents\Docora\backups",
    [int]$RetentionDays = 30
)

# Resolve default credentials from environment or Docker Compose defaults
if (-not $DbHost) { $DbHost = "localhost" }
if (-not $DbPort) { $DbPort = "5432" }
if (-not $DbUser) { $DbUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "docora_user" } }
if (-not $DbName) { $DbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "docora_db" } }
if (-not $env:PGPASSWORD) { 
    $env:PGPASSWORD = if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "docora_secure_password_123" }
}

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dumpFile = Join-Path $BackupDir "docora_backup_$timestamp.dump"
$checksumFile = Join-Path $BackupDir "docora_backup_$timestamp.sha256"

Write-Host "=========================================="
Write-Host " Starting Docora Database Backup"
Write-Host " Database:   $DbName"
Write-Host " User:       $DbUser"
Write-Host " Destination: $dumpFile"
Write-Host " Timestamp:  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "=========================================="

try {
    # Check if docora_postgres container is running
    $dockerContainerRunning = $false
    try {
        $containerStatus = docker ps --filter "name=^/${ContainerName}$" --format "{{.Status}}" 2>$null
        if ($containerStatus -match "Up") {
            $dockerContainerRunning = $true
        }
    } catch {
        $dockerContainerRunning = $false
    }

    if ($dockerContainerRunning) {
        Write-Host "Creating backup directly from running Docker container '$ContainerName'..."
        # Execute pg_dump inside container where 5432 is internally bound
        docker exec $ContainerName pg_dump -U $DbUser -d $DbName -F c -b > $dumpFile
    } elseif (Get-Command pg_dump -ErrorAction SilentlyContinue) {
        Write-Host "Creating backup using local host pg_dump client at $DbHost`:$DbPort..."
        & pg_dump -h $DbHost -p $DbPort -U $DbUser -F c -b -f $dumpFile $DbName
    } else {
        throw "Neither running Docker container '$ContainerName' nor local 'pg_dump' utility was found."
    }
    
    if (Test-Path $dumpFile -and (Get-Item $dumpFile).Length -gt 0) {
        $hash = (Get-FileHash -Path $dumpFile -Algorithm SHA256).Hash
        "$hash  $(Split-Path $dumpFile -Leaf)" | Out-File -FilePath $checksumFile -Encoding utf8
        
        $sizeBytes = (Get-Item $dumpFile).Length
        $sizeMB = [math]::Round($sizeBytes / 1MB, 2)
        Write-Host " Backup successful! Size: $sizeMB MB"
        Write-Host " SHA256 Checksum: $hash"
    } else {
        Write-Error "pg_dump produced an empty or missing backup file."
    }
} catch {
    Write-Error "Backup process error: $_"
}

# Retention Pruning: Delete backups older than $RetentionDays
Write-Host "Pruning backups older than $RetentionDays days in $BackupDir..."
$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "docora_backup_*" | Where-Object { $_.LastWriteTime -lt $cutoff } | Remove-Item -Force
Write-Host "Backup procedure finished."
