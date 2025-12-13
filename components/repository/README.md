# SPAS Repository Service

Repository service for the SPAS (Service Package Archive Schema) framework. Handles publishing, retrieval, search, and management of service archives and metadata.

## Features

- **Publish Services**: Upload service archives with metadata and schemas
- **Retrieve Services**: Fetch archived services by name and version
- **Search Services**: Query available services with advanced filtering
- **Schema Management**: Store and evolve service schemas following SPAS evolution rules
- **Validation**: Validate schemas against SPAS specification using JSON Schema
- **Runtime Metadata**: Enrich design-time metadata with deployment information (image digests, tags)

## Metadata Schemas

The repository handles two types of metadata:

- **Design-time Metadata** (`design-time-metadata-v1`): Authored by service developers, stored in `spas.json`
- **Runtime Metadata** (`runtime-metadata-v1`): Repository output with design-time enriched with deployment info

See [schemas/runtime-metadata-v1.schema.json](./schemas/runtime-metadata-v1.schema.json) for the complete runtime metadata schema specification.

## Tech Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Fastify HTTP server
- **Language**: TypeScript with strict mode
- **Storage**: SQLite (PoC) with IStorageProvider abstraction
- **Validation**: Ajv (JSON Schema validator)
- **Testing**: Jest with >80% coverage
- **Deployment**: Docker multi-stage Alpine build

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=development|production
LOG_LEVEL=debug|info|warn|error

# Storage
STORAGE_PROVIDER=sqlite|postgres  # Default: sqlite
DATABASE_URL=sqlite:///./data/repository.db
```

## Project Structure

```text
src/
├── routes/           # HTTP endpoint handlers
├── services/         # Business logic layer
├── storage/          # Data persistence (IStorageProvider pattern)
├── validation/       # Schema validation rules
├── models/           # TypeScript interfaces and types
└── index.ts          # Application entry point

test/
├── unit/             # Unit tests for services, validators, storage
├── integration/      # API endpoint tests
└── fixtures/         # Test data and mocks
```

## API Endpoints

### Publishing

#### Publish Service Version

```http
POST /services/{serviceName}:{version}
Content-Type: multipart/form-data
```

**Parameters:**
- `serviceName` (path): Service identifier (e.g., "order-service")
- `version` (path): Semantic version (e.g., "1.0.0")
- `archive` (form field): ZIP file containing spas.json + schemas
- `checksum` (form field, optional): SHA-256 checksum for verification
- `imageDigest` (form field, optional): Docker image SHA256 digest (e.g., "sha256:abc123...")
- `imageRepository` (form field, optional): Image repository (e.g., "ghcr.io/org/service")
- `imageTag` (form field, optional): Image tag (e.g., "1.0.0", "latest")

**Response:**
- `201 Created`: Service published successfully
- `400 Bad Request`: Invalid archive or validation failure
- `409 Conflict`: Service version already exists or identity mismatch

**Example:**
```bash
curl -X POST http://localhost:3000/services/order-service:1.0.0 \
  -F "archive=@order-service-1.0.0.zip" \
  -F "checksum=abc123..." \
  -F "imageDigest=sha256:def456..." \
  -F "imageRepository=ghcr.io/myorg/order-service" \
  -F "imageTag=1.0.0"
```

### Retrieval

#### Get Latest Service Information

```http
GET /services/{serviceName}
```

**Response:**
- `200 OK`: Returns ServiceInfo for latest version
- `404 Not Found`: Service does not exist

**Example:**
```bash
curl http://localhost:3000/services/order-service
```

**Response Body:**
```json
{
  "id": "order-service",
  "name": "Order Service",
  "version": "2.0.0",
  "description": "Manages order lifecycle",
  "boundedContext": "orders",
  "capabilities": ["order-management", "payment-processing"],
  "publishedAt": "2025-12-13T10:30:00Z",
  "runtime": {
    "digest": "sha256:def456...",
    "repository": "ghcr.io/myorg/order-service",
    "tag": "2.0.0",
    "image": "ghcr.io/myorg/order-service@sha256:def456..."
  }
}
```

**Note:** The `runtime` object is only present if runtime metadata was provided during publish.

#### List Service Versions

```http
GET /services/{serviceName}/versions
```

**Response:**
- `200 OK`: Returns list of versions in descending order
- `404 Not Found`: Service does not exist

**Example:**
```bash
curl http://localhost:3000/services/order-service/versions
```

**Response Body:**
```json
{
  "serviceName": "order-service",
  "versions": ["2.0.0", "1.5.0", "1.0.0"]
}
```

#### Get Service Metadata

```http
GET /services/{serviceName}/versions/{version}
```

**Response:**
- `200 OK`: Returns complete ServiceMetadata
- `404 Not Found`: Service version does not exist

**Example:**
```bash
curl http://localhost:3000/services/order-service/versions/1.0.0
```

#### List Service Schemas

```http
GET /services/{serviceName}/versions/{version}/schemas
```

**Response:**
- `200 OK`: Returns array of schemas (alphabetically sorted)
- `404 Not Found`: Service version does not exist

**Example:**
```bash
curl http://localhost:3000/services/order-service/versions/1.0.0/schemas
```

**Response Body:**
```json
{
  "serviceName": "order-service",
  "version": "1.0.0",
  "schemas": [
    {
      "name": "create-order",
      "type": "endpoint",
      "content": { "$schema": "...", "type": "object", ... }
    },
    {
      "name": "order-created",
      "type": "event",
      "content": { "$schema": "...", "type": "object", ... }
    }
  ]
}
```

#### Get Single Schema

```http
GET /services/{serviceName}/versions/{version}/schemas/{schemaName}
```

**Response:**
- `200 OK`: Returns schema content
- `404 Not Found`: Schema or service version does not exist

**Example:**
```bash
curl http://localhost:3000/services/order-service/versions/1.0.0/schemas/order-created
```

#### Download Service Archive

```http
GET /services/{serviceName}/versions/{version}/download
```

**Response:**
- `200 OK`: ZIP archive containing spas.json + all schemas
- `404 Not Found`: Service version does not exist

**Headers:**
- `Content-Type: application/zip`
- `Content-Disposition: attachment; filename="order-service-1.0.0.zip"`

**Example:**
```bash
curl -O -J http://localhost:3000/services/order-service/versions/1.0.0/download
```

### Search

#### Search by Capability

```http
GET /services?capability={capability}
```

**Parameters:**
- `capability` (query): Capability name to search for

**Response:**
- `200 OK`: Returns SearchResults with matching services (latest version only)
- `400 Bad Request`: Missing or empty capability parameter

**Example:**
```bash
curl http://localhost:3000/services?capability=payment-processing
```

**Response Body:**
```json
{
  "total": 2,
  "limit": 2,
  "offset": 0,
  "results": [
    {
      "id": "payment-service",
      "name": "Payment Service",
      "version": "2.0.0",
      "description": "Handles payments",
      "boundedContext": "payments",
      "capabilities": ["payment-processing", "refunds"],
      "publishedAt": "2025-12-13T10:30:00Z"
    },
    {
      "id": "order-service",
      "name": "Order Service",
      "version": "1.5.0",
      "description": "Manages orders",
      "boundedContext": "orders",
      "capabilities": ["order-management", "payment-processing"],
      "publishedAt": "2025-12-13T09:15:00Z"
    }
  ]
}
```

#### Search by Bounded Context

```http
GET /services?boundedContext={context}
```

**Parameters:**
- `boundedContext` (query): Bounded context name to search for

**Response:**
- `200 OK`: Returns SearchResults with matching services (latest version only)
- `400 Bad Request`: Missing or empty boundedContext parameter

**Example:**
```bash
curl http://localhost:3000/services?boundedContext=payments
```

### Unpublishing

#### Unpublish Service Version

```http
DELETE /services/{serviceName}/versions/{version}
```

**Response:**
- `204 No Content`: Service version deleted successfully
- `404 Not Found`: Service version does not exist

**Example:**
```bash
curl -X DELETE http://localhost:3000/services/order-service/versions/1.0.0
```

**Note:** This operation is atomic and cascades to delete all associated schemas. Other versions of the service are preserved.

### Health Check

```http
GET /health
```

**Response:**
- `200 OK`: Service is healthy
- `503 Service Unavailable`: Service or storage is unhealthy

**Example:**
```bash
curl http://localhost:3000/health
```

**Response Body:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-13T10:30:00Z",
  "version": "1.0.0",
  "storage": {
    "status": "ok"
  }
}
```

## Storage Abstraction

Repository uses the **IStorageProvider** pattern to support multiple storage backends:

### PoC (Default)

```typescript
// SQLite with better-sqlite3
const provider = new SqliteStorageProvider("./data/repository.db");
```

### Production

```typescript
// PostgreSQL + S3
const provider = new PostgresS3StorageProvider({
  pgConnection: "postgresql://...",
  s3Config: { region: "us-east-1", bucket: "spas-services" },
});
```

Switch providers via `STORAGE_PROVIDER` environment variable.

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm test -- --watch

# Run specific test file
npm test -- unit/storage/SqliteStorageProvider.test.ts
```

## Docker

### Build

```bash
docker build -t spas-repository:latest .
```

### Run

```bash
docker run -d \
  -p 3000:3000 \
  -v repository-data:/app/data \
  -e STORAGE_PROVIDER=sqlite \
  spas-repository:latest
```

### Health Check

```bash
curl http://localhost:3000/health
```

## Architecture Decisions

See [SPAS Principles](../../principles/) for detailed architecture documentation:

- **03-service-model.md**: Service definition and lifecycle
- **04-service-contract.md**: API contract and metadata structure
- **06-service-metadata.md**: Metadata schema and validation
- **11-repository.md**: Repository pattern and storage model
- **16-schema-registry.md**: Schema versioning and evolution

## Specification

See [Repository Service Specification](../../specs/003-repository-service/spec.md) for complete feature list, user stories, and success criteria.

## Optional Enhancements Not Completed (Phase 8)

The following tasks were optional for the PoC and remain incomplete:

- T066: OpenTelemetry integration (Zipkin export)
- T071: Edge case unit tests (concurrent publishes, storage full, corrupted ZIP)
- T072: Performance validation (publish ≤5s, retrieve ≤2s, search ≤1s)
- T074: Quickstart validation (curl examples against running service)

PoC completion: All 5 user stories implemented, 10 endpoints documented, security reviewed, and 99 tests passing.

## License

See [LICENSE](../../LICENSE) in project root.
