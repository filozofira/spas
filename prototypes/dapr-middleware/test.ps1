#!/usr/bin/env pwsh
# Test script for DAPR middleware prototype
# Runs without requiring Go installed locally; uses Docker

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ComposeFile = Join-Path $ScriptDir "docker-compose.yml"

Write-Host "=== DAPR Middleware Transformation Test ===" -ForegroundColor Cyan
Write-Host "Starting docker-compose services..." -ForegroundColor Green

# Start services in background
Push-Location $ScriptDir
docker-compose up -d

# Wait for services to be ready
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Test 1: Send inbound event through middleware
Write-Host "`n[TEST 1] Inbound Event Transformation" -ForegroundColor Cyan
Write-Host "Sending event through middleware to app..." -ForegroundColor Green

$payload = @{
    eventType = "order.created"
    orderId = "12345"
    amount = 99.99
} | ConvertTo-Json

# Send to middleware on port 8080
$response = Invoke-WebRequest -Uri "http://localhost:8080/inbound" `
    -Method POST `
    -ContentType "application/json" `
    -Body $payload `
    -ErrorAction SilentlyContinue

if ($response.StatusCode -eq 200) {
    Write-Host "Inbound response status: 200" -ForegroundColor Green
} else {
    Write-Host "Inbound request failed!" -ForegroundColor Red
}

# Wait for processing
Start-Sleep -Seconds 1

# Test 2: Verify transformation
Write-Host "`n[TEST 2] Verifying Inbound Transformation" -ForegroundColor Cyan
Write-Host "Fetching stats from app..." -ForegroundColor Green

$statsResponse = Invoke-WebRequest -Uri "http://localhost:8081/stats" `
    -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Content | ConvertFrom-Json

if ($statsResponse.messagesReceived -gt 0) {
    $firstMsg = $statsResponse.messages[0]
    if ($firstMsg.transformed_inbound -eq $true) {
        Write-Host "✓ SUCCESS: Inbound transformation confirmed!" -ForegroundColor Green
        Write-Host "  Received payload with transformed_inbound=true"
        Write-Host "  Full payload: $($firstMsg | ConvertTo-Json)"
    } else {
        Write-Host "✗ FAILURE: No transformation marker found!" -ForegroundColor Red
        Write-Host "  Received payload: $($firstMsg | ConvertTo-Json)"
    }
} else {
    Write-Host "✗ FAILURE: No messages received by app!" -ForegroundColor Red
}

# Test 3: Outbound transformation
Write-Host "`n[TEST 3] Outbound Publish Transformation" -ForegroundColor Cyan
Write-Host "Sending publish request through middleware..." -ForegroundColor Green

$pubPayload = @{
    eventType = "stock.updated"
    stock = 150
} | ConvertTo-Json

$pubResponse = Invoke-WebRequest -Uri "http://localhost:8080/publish" `
    -Method POST `
    -ContentType "application/json" `
    -Body $pubPayload `
    -ErrorAction SilentlyContinue

if ($pubResponse.StatusCode -eq 200) {
    Write-Host "✓ Publish response status: 200" -ForegroundColor Green
    Write-Host "  (Note: In full integration, DAPR would receive the transformed payload)"
} else {
    Write-Host "✗ Publish request failed!" -ForegroundColor Red
}

Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "If both inbound and outbound transformations occurred, middleware works as expected."

Write-Host "`nView live logs with: docker-compose logs -f"
Write-Host "Stop services with: docker-compose down"

Pop-Location
