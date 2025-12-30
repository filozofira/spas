$ErrorActionPreference = 'Stop'

$scriptRoot = $PSScriptRoot

Write-Host 'Generating design-time metadata archives (offline)'

# .NET services
Push-Location (Join-Path $scriptRoot 'order-service')
dotnet run -- --generate-metadata
Pop-Location

Push-Location (Join-Path $scriptRoot 'inventory-service')
dotnet run -- --generate-metadata
Pop-Location

Push-Location (Join-Path $scriptRoot 'product-service')
dotnet run -- --generate-metadata
Pop-Location

Push-Location (Join-Path $scriptRoot 'subscription-service')
dotnet run -- --generate-metadata
Pop-Location

# Java services (Spring Boot)
Push-Location (Join-Path $scriptRoot 'fulfillment-service')
java -jar target\fulfillment-service-1.0.0-SNAPSHOT.jar --generate-metadata --output ./metadata;
Pop-Location

Push-Location (Join-Path $scriptRoot 'basket-service')
java -jar target\basket-service-1.0.0-SNAPSHOT.jar --generate-metadata --output ./metadata;
Pop-Location

Write-Host "Done generating metadata archives"
