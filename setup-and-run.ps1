# Evilginx Local Testing Setup with Migration Fix
# This script properly sets up the environment including database migrations

$ErrorActionPreference = "Stop"

$TestDir = "C:\evilginx-test-run"
$ExePath = "C:\Users\user\Downloads\Evil\ginx3\Evilginx3\evilginx.exe"
$SourceDir = "C:\Users\user\Downloads\Evil\ginx3\Evilginx3"

Write-Host "=== Evilginx Local Test Setup with Migration Fix ===" -ForegroundColor Cyan

# Kill any existing processes
$existing = Get-Process | Where-Object { $_.ProcessName -like "*evilginx*" }
if ($existing) {
    Write-Host "Stopping existing processes..." -ForegroundColor Yellow
    $existing | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Clean up old test directory
if (Test-Path $TestDir) {
    Write-Host "Cleaning up old test directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $TestDir
}

# Create directory structure
Write-Host "Creating directory structure..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path "$TestDir\phishlets" | Out-Null
New-Item -ItemType Directory -Force -Path "$TestDir\redirectors" | Out-Null
New-Item -ItemType Directory -Force -Path "$TestDir\post_redirectors" | Out-Null
New-Item -ItemType Directory -Force -Path "$TestDir\landing_pages" | Out-Null

# CRITICAL: Create the gophish_db migrations directory structure
New-Item -ItemType Directory -Force -Path "$TestDir\gophish_db\db_sqlite3\migrations" | Out-Null

# Copy phishlets
Write-Host "Copying phishlets..." -ForegroundColor Green
Copy-Item -Recurse -Force "$SourceDir\phishlets\*" "$TestDir\phishlets\" | Out-Null

# Copy landing pages
if (Test-Path "$SourceDir\landing_pages") {
    Write-Host "Copying landing pages..." -ForegroundColor Green
    Copy-Item -Recurse -Force "$SourceDir\landing_pages\*" "$TestDir\landing_pages\" | Out-Null
}

# CRITICAL: Copy migration files manually (workaround for embedded FS issue)
Write-Host "Copying database migration files..." -ForegroundColor Green
$MigrationsSource = "$SourceDir\gophish\db\db_sqlite3\migrations"
$MigrationsDest = "$TestDir\gophish_db\db_sqlite3\migrations"

if (Test-Path $MigrationsSource) {
    $migrationFiles = Get-ChildItem $MigrationsSource -Filter "*.sql"
    foreach ($file in $migrationFiles) {
        Copy-Item $file.FullName -Destination $MigrationsDest -Force
    }
    Write-Host "  Copied $($migrationFiles.Count) migration files" -ForegroundColor Gray
} else {
    Write-Host "  WARNING: Migration source not found at $MigrationsSource" -ForegroundColor Red
}

# Check hosts file
Write-Host "`n=== Hosts File Check ===" -ForegroundColor Cyan
$HostsFile = "C:\Windows\System32\drivers\etc\hosts"
$HostEntries = @(
    "127.0.0.1    www.localtest.com",
    "127.0.0.1    localtest.com",
    "127.0.0.1    admin.localtest.com"
)

$CurrentHosts = Get-Content $HostsFile -ErrorAction SilentlyContinue
$NeedsUpdate = $false
foreach ($entry in $HostEntries) {
    if ($CurrentHosts -notmatch $entry.Replace("    ", "\s+")) {
        $NeedsUpdate = $true
        break
    }
}

if ($NeedsUpdate) {
    Write-Host "Hosts file needs updating. Please run as Administrator or add these entries manually:" -ForegroundColor Yellow
    foreach ($entry in $HostEntries) {
        Write-Host "  $entry" -ForegroundColor White
    }
} else {
    Write-Host "Hosts file already configured correctly." -ForegroundColor Green
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "Test directory: $TestDir" -ForegroundColor Gray
Write-Host "Migrations: $MigrationsDest" -ForegroundColor Gray

# Check if binary exists
if (-not (Test-Path $ExePath)) {
    Write-Host "`nBuilding evilginx..." -ForegroundColor Yellow
    Set-Location $SourceDir
    go build -o evilginx.exe .
    if (-not $?) { 
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1 
    }
}

# Show quick commands
Write-Host "`n=== Quick Commands ===" -ForegroundColor Cyan
Write-Host "  domains set localtest.com" -ForegroundColor White
Write-Host "  config ipv4 external 127.0.0.1" -ForegroundColor White
Write-Host "  phishlets hostname o365 login.localtest.com" -ForegroundColor White
Write-Host "  phishlets enable o365" -ForegroundColor White
Write-Host "  lures create o365" -ForegroundColor White
Write-Host "  lures get-url 0" -ForegroundColor White
Write-Host "`n=== Admin Panels ===" -ForegroundColor Cyan
Write-Host "  Web Admin:    http://127.0.0.1:2030/  (credentials printed at startup)" -ForegroundColor White
Write-Host "  Gophish UI:   http://127.0.0.1:3333/  (admin + password printed at startup)" -ForegroundColor White

Write-Host "`nStarting Evilginx in 3 seconds... (Press Ctrl+C to cancel)" -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Change to the directory where the binary is located (important for embedded FS)
Set-Location (Split-Path $ExePath -Parent)

# Run evilginx
& $ExePath -developer -c $TestDir -l "$TestDir\landing_pages" -debug
