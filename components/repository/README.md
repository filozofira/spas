# SPAS Repository Service

Repository service for the SPAS (Service Package Archive Schema) framework. Handles publishing, retrieval, search, and management of service archives and metadata.

## Features

- **Publish Services**: Upload service archives with metadata and schemas
- **Retrieve Services**: Fetch archived services by name and version
- **Search Services**: Query available services with advanced filtering
- **Schema Management**: Store and evolve service schemas following SPAS evolution rules
- **Validation**: Validate schemas against SPAS specification using JSON Schema

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

### Publish Service

- **POST** `/services/{name}:{version}`
- **Body**: Multipart form with archive and metadata
- **Response**: `201 Created` with service metadata

### Retrieve Service

- **GET** `/services/{name}:{version}`
- **Response**: `200 OK` with archived service package

### List Services

- **GET** `/services`
- **Query**: `?search=term&limit=10&offset=0`
- **Response**: `200 OK` with service list

### Get Service Metadata

- **GET** `/services/{name}:{version}/metadata`
- **Response**: `200 OK` with metadata

### Get Service Schema

- **GET** `/services/{name}:{version}/schema`
- **Response**: `200 OK` with JSON schema

### Unpublish Service

- **DELETE** `/services/{name}:{version}`
- **Response**: `204 No Content`

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

See [Repository Service Specification](./spec.md) for complete feature list, user stories, and success criteria.

## License

See [LICENSE](../../LICENSE) in project root.
