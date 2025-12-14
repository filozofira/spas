# spas-service CLI

Command-line tool for publishing and managing SPAS service metadata.

## Overview

The `spas-service` CLI streamlines the SPAS service publishing workflow, enabling developers to publish their service metadata to a SPAS Repository with a single command. It bridges the gap between local service development (using SPAS SDKs) and the SPAS Repository.

## Installation

### Global Installation

```bash
npm install -g @spas/cli
```

### Verify Installation

```bash
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

## Commands

### publish

Publish service metadata to the Repository.

```bash
spas-service publish <service-host> [options]
spas-service publish --archive <path> [options]
```

**Options:**
- `--repo <url>` - Repository URL (default: `$SPAS_REPOSITORY_URL` or `http://localhost:3000`)
- `--dry-run` - Download and inspect metadata without publishing
- `--archive <path>` - Publish a local ZIP file instead of downloading from service

**Examples:**

```bash
# Interactive mode (downloads from running service)
spas-service publish http://localhost:5000

# With custom repository URL
spas-service publish http://localhost:5000 --repo http://repo.example.com

# Dry run mode
spas-service publish http://localhost:5000 --dry-run

# Archive mode
spas-service publish --archive ./my-service-1.0.0.zip
```

### pull

Download service metadata from the Repository.

```bash
spas-service pull <name> <version> [options]
```

**Options:**
- `--repo <url>` - Repository URL (default: `$SPAS_REPOSITORY_URL` or `http://localhost:3000`)
- `--output <dir>` - Output directory (default: current directory)

**Examples:**

```bash
# Download to current directory
spas-service pull order-service 1.0.0

# Download to specific directory
spas-service pull order-service 1.0.0 --output ./services/

# With custom repository URL
spas-service pull order-service 1.0.0 --repo http://repo.example.com
```

## Common Errors

### Service Not Available

```
✗ Service metadata endpoint not available
  Hint: Ensure service is running in Development mode
```

**Solution**: Make sure your service is running and accessible at the specified host. For .NET services, set `ASPNETCORE_ENVIRONMENT=Development`.

### Metadata Endpoint Disabled

```
✗ Metadata endpoint disabled
  Hint: Set ASPNETCORE_ENVIRONMENT=Development
```

**Solution**: The `/_spas/metadata` endpoint is only available in Development mode. Set the appropriate environment variable.

### Repository Validation Error

```
✗ Repository validation failed
  Details: Missing required field 'boundedContext' in spas.json
```

**Solution**: Ensure your service metadata matches the SPAS schema requirements. Check the [design-time-metadata-v1 schema](../../sdk/schemas/design-time-metadata-v1.schema.json).

### Version Conflict

```
✗ Version already published
  Hint: Increment version or unpublish existing version
```

**Solution**: The service version already exists in the Repository. Either increment your service version or unpublish the existing version using the Repository API.

## Development

### Local Development Setup

For testing the CLI during development without publishing to npm:

#### Option 1: npm link (Recommended for Development)

This creates a global symlink so changes to the CLI code are immediately available:

```bash
# In the CLI project directory
cd components/cli/spas-service
npm link

# Now you can use the CLI globally
spas-service --version

# To use it in SDK examples or other projects
cd components/sdk/dotnet/examples
npm link @spas/cli

# Unlink when done
npm unlink -g @spas/cli
```

#### Option 2: Local Path Installation

Install directly from the local filesystem (useful for CI/CD or examples):

```bash
# In your project that needs the CLI
npm install ../../../cli/spas-service

# Or add to package.json
{
  "devDependencies": {
    "@spas/cli": "file:../../../cli/spas-service"
  }
}
```

#### Option 3: Direct Path Execution

Run the CLI directly without installation:

```bash
cd components/cli/spas-service
npm run build
node dist/index.js publish http://localhost:5000
```

### Building

```bash
npm run build       # Compile TypeScript to dist/
npm run watch      # Watch mode for development
npm run clean      # Remove dist/ directory
```

### Testing

```bash
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
```

### Code Quality

```bash
npm run lint            # Run ESLint
```

## License

MIT
