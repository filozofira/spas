# Services

These SPAS-compliant example services are used to demonstrate choreography across domains.

## PowerShell Scripts

Use the helper scripts in this folder to build images, retrieve service metadata archives, and publish them to the SPAS Repository.

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

Generates `*.zip` metadata archives by calling each running service on localhost ports 5000–5004.

Prerequisite: Start the example services.

```powershell
# From the examples/services folder
docker compose up --build -d

# Generate archives
pwsh ./Get-ServiceMetadata.ps1
# Archives will be written to ./metadata

# Stop services when done (optional)
docker compose down
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
# Start services
cd ../../examples/services
docker compose up --build -d

# Download metadata to ./metadata
mkdir -Force ./metadata
spas-service publish http://localhost:5000 --dry-run --output ./metadata
spas-service publish http://localhost:5001 --dry-run --output ./metadata
spas-service publish http://localhost:5002 --dry-run --output ./metadata
spas-service publish http://localhost:5003 --dry-run --output ./metadata
spas-service publish http://localhost:5004 --dry-run --output ./metadata

# Stop services
docker compose down
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
