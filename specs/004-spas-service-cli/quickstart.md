# Quickstart: spas-service CLI

**Feature**: 004-spas-service-cli  
**Version**: 1.0.0 (PoC)

**Note**: The runtime metadata endpoint `/_spas/metadata` has been removed in favor of offline metadata archive generation (see `specs/021-sdk-metadata-extraction`). This quickstart describes the earlier PoC workflow and needs updating for the new offline archive flow.

## Installation

```bash
# Install globally from npm
npm install -g @spas/cli

# Verify installation
spas-service --version
```

## Prerequisites

1. **SPAS SDK Service**: A service built with SPAS .NET SDK (or other SDK) running in Development mode
2. **SPAS Repository**: Repository service running (default: `http://localhost:3000`)

## Quick Start

### Publish a Service

1. **Start your SPAS Repository** (if not already running):
   ```bash
   cd components/repository
   npm start
   ```

2. **Run the publish command**:
   ```bash
   spas-service publish http://localhost:5000 --repo http://localhost:3000
   ```

3. **When prompted**, start your service and press Enter:
   ```
   Start your service at http://localhost:5000 and press Enter to continue...
   ```

4. **Success output**:
   ```
   ✓ Downloaded metadata from http://localhost:5000/_spas/metadata
   ✓ Extracted service identity: order-service:1.0.0
   ✓ Published to http://localhost:3000/services/order-service:1.0.0
   
   Service published successfully!
   ```

### Dry Run (Preview Without Publishing)

```bash
spas-service publish http://localhost:5000 --dry-run
```

Output:
```
✓ Downloaded metadata from http://localhost:5000/_spas/metadata
✓ Saved to ./order-service-1.0.0.zip

Archive contents:
  - spas.json (order-service v1.0.0)
  - schemas/endpoints/create-order.schema.json
  - schemas/events/order-created.schema.json
  
Dry run complete. No changes published.
```

### Publish Pre-Built Archive

For CI/CD scenarios where the service isn't running:

```bash
spas-service publish --archive ./order-service-1.0.0.zip --repo http://localhost:3000
```

### Pull a Service

Download a published service's metadata:

```bash
spas-service pull order-service 1.0.0 --repo http://localhost:3000
```

Output:
```
✓ Downloaded order-service:1.0.0
✓ Saved to ./order-service-1.0.0.zip
```

Specify output directory:

```bash
spas-service pull order-service 1.0.0 --output ./services/
```

## Configuration

### Repository URL

Set default repository URL via environment variable:

```bash
# Linux/macOS
export SPAS_REPOSITORY_URL=http://localhost:3000

# Windows PowerShell
$env:SPAS_REPOSITORY_URL = "http://localhost:3000"

# Then publish without --repo flag
spas-service publish http://localhost:5000
```

## Common Errors

### Service Not Available

```
✗ Service metadata endpoint not available
  Hint: Ensure service is running in Development mode
  URL: http://localhost:5000/_spas/metadata
```

**Solution**: Start your service with `ASPNETCORE_ENVIRONMENT=Development`

### Version Already Published

```
✗ Version already published
  Hint: Increment version in your service or use a different version
  Service: order-service:1.0.0
```

**Solution**: Update the version in your service's metadata configuration

### Repository Unreachable

```
✗ Repository unreachable
  Hint: Ensure SPAS Repository is running at the specified URL
  URL: http://localhost:3000
```

**Solution**: Start the Repository service or check the `--repo` URL

## Command Reference

```bash
# Publish from running service
spas-service publish <service-host> [options]

Options:
  --repo <url>     Repository URL (default: SPAS_REPOSITORY_URL or localhost:3000)
  --dry-run        Download and display archive without publishing
  --archive <path> Publish local ZIP file instead of downloading
  -h, --help       Show help

# Pull from repository  
spas-service pull <name> <version> [options]

Options:
  --repo <url>     Repository URL
  --output <dir>   Output directory (default: current directory)
  -h, --help       Show help
```

## End-to-End Example

```bash
# 1. Start Repository
cd components/repository && npm start &

# 2. Build and start your .NET service
cd examples/e-commerce/services/order-service
dotnet run &

# 3. Publish the service
spas-service publish http://localhost:5000

# 4. Verify it's in the repository
curl http://localhost:3000/services/order-service

# 5. Pull it back
spas-service pull order-service 1.0.0 --output ./downloaded/
```
