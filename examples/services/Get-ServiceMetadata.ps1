$ErrorActionPreference = 'Stop'

$scriptRoot = $PSScriptRoot
$outDir = Join-Path $scriptRoot 'metadata'

mkdir -Force $outDir | Out-Null

function Copy-MetadataArchive {
	param(
		[Parameter(Mandatory=$true)][string]$serviceDir,
		[Parameter(Mandatory=$true)][string]$archiveName
	)

	$sourceArchive = Join-Path $serviceDir 'metadata/service.metadata.zip'
	if (-not (Test-Path $sourceArchive)) {
		throw "Expected metadata archive not found: $sourceArchive"
	}

	Copy-Item -Force $sourceArchive (Join-Path $outDir $archiveName)
}

Write-Host 'Generating design-time metadata archives (offline)'

# .NET services
Push-Location (Join-Path $scriptRoot 'order-service')
dotnet run -- --generate-metadata
Pop-Location
Copy-MetadataArchive -serviceDir (Join-Path $scriptRoot 'order-service') -archiveName 'order-service-1.0.0.zip'

Push-Location (Join-Path $scriptRoot 'inventory-service')
dotnet run -- --generate-metadata
Pop-Location
Copy-MetadataArchive -serviceDir (Join-Path $scriptRoot 'inventory-service') -archiveName 'inventory-service-1.0.0.zip'

Push-Location (Join-Path $scriptRoot 'product-service')
dotnet run -- --generate-metadata
Pop-Location
Copy-MetadataArchive -serviceDir (Join-Path $scriptRoot 'product-service') -archiveName 'product-service-1.0.0.zip'

Push-Location (Join-Path $scriptRoot 'subscription-service')
dotnet run -- --generate-metadata
Pop-Location
Copy-MetadataArchive -serviceDir (Join-Path $scriptRoot 'subscription-service') -archiveName 'subscription-service-1.0.0.zip'

# Java services (Spring Boot)
Push-Location (Join-Path $scriptRoot 'fulfillment-service')
mvn -q -DskipTests spring-boot:run -Dspring-boot.run.arguments="--generate-metadata"
Pop-Location
Copy-MetadataArchive -serviceDir (Join-Path $scriptRoot 'fulfillment-service') -archiveName 'fulfillment-service-1.0.0.zip'

Push-Location (Join-Path $scriptRoot 'basket-service')
mvn -q -DskipTests spring-boot:run -Dspring-boot.run.arguments="--generate-metadata"
Pop-Location
Copy-MetadataArchive -serviceDir (Join-Path $scriptRoot 'basket-service') -archiveName 'basket-service-1.0.0.zip'

Write-Host "Wrote archives to $outDir"
