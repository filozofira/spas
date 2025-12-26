# Data Model: SPAS-Service CLI Tool

**Feature**: 004-spas-service-cli  
**Created**: 2025-12-14

**Note**: The legacy runtime metadata endpoint has been removed in favor of offline metadata archive generation (see `specs/021-sdk-metadata-extraction`). This data model describes the earlier PoC workflow and needs updating for the new offline archive flow.

## Overview

The `spas-service` CLI is a stateless command-line tool. It does not persist data but operates on:
- Input: Command-line arguments, environment variables, running services, local files
- Output: Console messages, downloaded ZIP files, HTTP requests to Repository

## Command Models

### publish Command

```typescript
interface PublishOptions {
  serviceHost?: string;      // URL of running service (e.g., "http://localhost:5000")
  archive?: string;          // Path to local ZIP file (alternative to serviceHost)
  repo?: string;             // Repository URL (default: from env or localhost:3000)
  dryRun?: boolean;          // Download only, don't publish
}

// Derived from archive contents
interface ServiceIdentity {
  id: string;                // Service ID from spas.json (e.g., "order-service")
  name: string;              // Human-readable name
  version: string;           // Semver version (e.g., "1.0.0")
}
```

**Command Signatures**:
```bash
# Interactive mode (downloads from running service)
spas-service publish <service-host> [--repo <url>] [--dry-run]

# Archive mode (uses local ZIP file)
spas-service publish --archive <path> [--repo <url>] [--dry-run]
```

### pull Command

```typescript
interface PullOptions {
  serviceName: string;       // Service ID to download
  version: string;           // Version to download
  repo?: string;             // Repository URL
  output?: string;           // Output directory (default: current directory)
}
```

**Command Signature**:
```bash
spas-service pull <name> <version> [--repo <url>] [--output <dir>]
```

## External Data Contracts

### SDK Metadata Endpoint (Legacy - Removed)

**Endpoint**: (removed)

**Response**: 
- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename="spas-metadata.zip"`

**Archive Structure** (after SDK alignment):
```
{serviceName}-{version}.zip
├── spas.json
├── schemas/
│   ├── endpoints/
│   │   └── {endpoint-name}.schema.json
│   └── events/
│       └── {event-type}.schema.json
└── (optional) mappings/
```

### Repository Publish API

**Endpoint**: `POST /services/{serviceId}:{version}`

**Request**:
- Content-Type: `multipart/form-data`
- Fields:
  - `archive` (file): ZIP file
  - `checksum` (optional): SHA-256 hash
  - `imageDigest` (optional): Docker image digest
  - `imageRepository` (optional): Image repository
  - `imageTag` (optional): Image tag

**Responses**:
- `201 Created`: Success
- `400 Bad Request`: Invalid archive
- `409 Conflict`: Version already exists

### Repository Download API

**Endpoint**: `GET /services/{serviceId}/versions/{version}/download`

**Response**:
- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename="{serviceId}-{version}.zip"`

## Configuration Model

```typescript
interface CliConfig {
  repositoryUrl: string;     // Resolved from --repo flag, env var, or default
}

// Resolution priority (highest to lowest):
// 1. --repo command-line flag
// 2. SPAS_REPOSITORY_URL environment variable  
// 3. Default: "http://localhost:3000"
```

## Error Model

```typescript
interface CliError {
  code: ErrorCode;
  message: string;           // User-friendly message
  hint?: string;             // Actionable remediation
  details?: unknown;         // Technical details for debugging
}

enum ErrorCode {
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  METADATA_DISABLED = 'METADATA_DISABLED',
  ARCHIVE_INVALID = 'ARCHIVE_INVALID',
  REPOSITORY_UNREACHABLE = 'REPOSITORY_UNREACHABLE',
  REPOSITORY_VALIDATION_ERROR = 'REPOSITORY_VALIDATION_ERROR',
  VERSION_CONFLICT = 'VERSION_CONFLICT',
  NOT_FOUND = 'NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
}
```

## spas.json Structure (Reference)

The CLI must extract `id` and `version` from the archive's `spas.json`:

```typescript
interface SpasMetadata {
  schemaVersion: 'design-time-metadata-v1';
  id: string;                // e.g., "order-service"
  name: string;              // e.g., "Order Service"
  version: string;           // e.g., "1.0.0"
  boundedContext: string;
  // ... additional fields not needed by CLI
}
```
