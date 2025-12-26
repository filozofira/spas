# Services

These SPAS-compliant example services are used to demonstrate choreography across domains.

## PowerShell Scripts

Use the helper scripts in this folder to build images (optional), generate service metadata archives offline, and publish them to the SPAS Repository.

### 1) Build all service images

Script: `Build-Services.ps1`

Builds local Docker images for all example services (development/latest tags).

```powershell
# From the examples/services folder
pwsh ./Build-Services.ps1
# or on Windows PowerShell
./Build-Services.ps1
```

Notes:
- Uses the repository root as the Docker build context.
- Produces images like `spas-examples/order-service:latest` for local/dev use.

### 2) Get service metadata archives

Script: `Get-ServiceMetadata.ps1`

Generates `*.zip` metadata archives by running each service in **offline metadata generation** mode.

Notes:
- Images are not the intended path for generating metadata.
- This does not require starting any service HTTP servers.

```powershell
# From the examples/services folder
pwsh ./Get-ServiceMetadata.ps1
# Archives will be written to ./metadata
```

### 3) Publish metadata to the SPAS Repository

Script: `Publish-Services.ps1`

Publishes the generated archives from `./metadata` to your SPAS Repository with image coordinates and digests.

Prerequisite: Start the Repository service stack.

```powershell
# Start repository (from components/repository)
cd ../../components/repository
docker compose up -d

# Publish archives (from examples/services)
cd ../../examples/services
pwsh ./Publish-Services.ps1

# Stop repository (optional)
cd ../../components/repository
docker compose down -v
```

## Manual (Alternative) Commands

You can run the CLI directly if you prefer manual steps.

### Get metadata

```powershell
cd ../../examples/services

# Generate offline archives into ./metadata
pwsh ./Get-ServiceMetadata.ps1
```

### Publish archives

```powershell
# Start repository
cd ../../components/repository
docker compose up -d

# Publish (from examples/services)
cd ../../examples/services
spas-service publish --archive ./metadata/order-service-1.0.0.zip `
  --image-repository spas-examples/order-service `
  --image-tag 1.0.0 `
  --image-digest <digest>

spas-service publish --archive ./metadata/inventory-service-1.0.0.zip `
  --image-repository spas-examples/inventory-service `
  --image-tag 1.0.0 `
  --image-digest <digest>

spas-service publish --archive ./metadata/product-service-1.0.0.zip `
  --image-repository spas-examples/product-service `
  --image-tag 1.0.0 `
  --image-digest <digest>

spas-service publish --archive ./metadata/subscription-service-1.0.0.zip `
  --image-repository spas-examples/subscription-service `
  --image-tag 1.0.0 `
  --image-digest <digest>

spas-service publish --archive ./metadata/fulfillment-service-1.0.0.zip `
  --image-repository spas-examples/fulfillment-service `
  --image-tag 1.0.0 `
  --image-digest <digest>

# Stop repository
cd ../../components/repository
docker compose down -v
```
