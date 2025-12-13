# Research & Decisions (Phase 0)

This document consolidates research and final decisions for the SPAS Repository Service PoC.

## Unknowns extracted from Technical Context

- Language/runtime: ✅ DECIDED (Node.js 20)
- Libraries: ✅ DECIDED (Fastify, Ajv, unzipper, pino)
- Production storage: ✅ DECIDED (PostgreSQL JSONB + S3)
- Observability stack: ✅ DECIDED (pino for structured logging; OpenTelemetry Node.js SDK for traces)

## Technology Shortlist

### Service implementation language

- .NET 8 Minimal API
  - Pros: Strong typing, good Windows/Linux support, good tooling; matches existing SDK in repo
  - Cons: Heavier runtime than Node; JSON Schema libs vary
- Node.js 20 (Fastify)
  - Pros: Fast dev cycle, excellent JSON tooling, good ZIP libs
  - Cons: Single-threaded; requires discipline for structure
- Python 3.11 (FastAPI)
  - Pros: Rapid prototyping, rich JSON/ZIP ecosystem
  - Cons: Perf overhead; GIL considerations

Decision: ✅ **Node.js 20 + Fastify** (2025-12-13)

- Rationale: Fastest PoC development, proven in sidecar prototype, excellent async I/O, rich npm ecosystem

### JSON Schema validation

- Node: ajv
- .NET: Newtonsoft.Json.Schema or NJsonSchema
- Python: jsonschema

Decision: ✅ **Ajv** (2025-12-13)

- Rationale: Industry standard for Node.js, excellent performance, custom validation support

### ZIP processing (multipart archive)

- Node: `adm-zip` or `yauzl` / `unzipper`
- .NET: `System.IO.Compression`
- Python: `zipfile`

Decision: ✅ **unzipper** (2025-12-13)

- Rationale: Stream-based, well-maintained, good for Fastify multipart integration

### Storage

- PoC: SQLite (embedded database) with JSON support:
  - Single file: `repository.db`
  - Native ACID transactions (no corruption risk)
  - JSON queries via `json_extract()`, `json_each()`
  - Tables: `services` (metadata as JSON), `schemas` (schema content as JSON)
  - Generated columns for fast search (boundedContext)
- Production: PostgreSQL (JSONB) for metadata + S3-compatible object store for schemas

Decision: ✅ **SQLite (PoC), PostgreSQL + S3 (Production)** (2025-12-13)

- Rationale: SQLite provides ACID transactions, native JSON queries, offline operation, and easier migration path to PostgreSQL than file-based storage. Single-file database (~50KB overhead) with better concurrency than file locks.

## API & Validation Patterns

- Path-keyed identity: `POST /services/{serviceName}:{version}` (source of truth)
- Content-Type: multipart/form-data with part `archive` (ZIP); optional part `checksum` (SHA-256) per clarification
- Validation sequence:
  1. Parse path identity; check duplicate
  2. Unpack ZIP; ensure `spas.json` exists; load schemas
  3. Validate `spas.json` against SPAS schema; check required fields
  4. Confirm path identity matches `spas.json`
  5. If `checksum` present, verify SHA-256 against ZIP bytes (PoC optional; production required)
  6. Enforce additive-only schema evolution versus latest version
  7. Persist metadata + schemas atomically

## Testing Strategy

**Framework**: Jest with ts-jest for TypeScript support

**Structure**:

```text
test/
├── unit/
│   ├── validation.test.js      # JSON Schema, evolution rules
│   ├── storage.test.js          # File operations, index management
│   └── services.test.js         # Business logic per user story
├── integration/
│   ├── publish.test.js          # Full publish flow (US1)
│   ├── retrieve.test.js         # Full retrieve flow (US2)
│   └── search.test.js           # Search scenarios (US3, US4)
└── fixtures/
    ├── valid-service.zip        # Sample archives
    ├── invalid-schema.zip
    └── spas-schema.json         # SPAS metadata schema
```

**Coverage Requirements**:

- Unit tests for each user story acceptance scenario (mandatory per Constitution)
- Integration tests for end-to-end API flows
- Target: >80% coverage for business logic
- Mocks: File system operations in unit tests; real files in integration tests

**Configuration**: Parallel execution, coverage reports (lcov, text-summary), watch mode for development

Decision: ✅ **Jest** (2025-12-13)

## TypeScript Configuration

**Package Manager**: npm (ships with Node.js 20)

**TypeScript Config** (strict mode for PoC quality):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true
  }
}
```

Decision: ✅ **npm + TypeScript strict mode** (2025-12-13)

- Rationale: npm is default, no extra install; strict mode catches errors early

## Docker & Deployment Configuration

**Dockerfile** (Multi-stage build):

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/index.js"]
```

**Environment Variables** (per ADR-034 - infrastructure config as env vars):

```bash
# Service configuration
PORT=8080
LOG_LEVEL=info
ZIPKIN_URL=http://zipkin:9411  # Optional for PoC
SPAS_SCHEMA_PATH=/app/schemas/design-time-metadata-v1.schema.json

# Storage configuration (PoC)
STORAGE_PROVIDER=sqlite
SQLITE_PATH=/data/repository.db

# Storage configuration (Production - future)
# STORAGE_PROVIDER=postgres
# POSTGRES_URL=postgresql://user:pass@host:5432/spas
# S3_BUCKET=spas-schemas
# S3_REGION=us-east-1
```

**Volume Mount**: `/data` for persistent storage (SQLite database file)

Decision: ✅ **Multi-stage Alpine Docker build** (2025-12-13)

- Rationale: Minimal image size, production-ready pattern, env var config per ADR-034

## Storage Abstraction Design (Open-Closed Principle)

**Requirement**: Implementation MUST create appropriate abstractions to allow switching from SQLite (PoC) to PostgreSQL + S3 (Production) without modifying existing code (Open-Closed Principle).

**Interface Design**:

```typescript
// src/storage/IStorageProvider.ts
interface IStorageProvider {
  // Publishing
  publishService(name: string, version: string, metadata: ServiceMetadata, schemas: Schema[]): Promise<void>;
  serviceExists(name: string, version: string): Promise<boolean>;
  
  // Retrieval
  getServiceMetadata(name: string, version: string): Promise<ServiceMetadata>;
  getServiceVersions(name: string): Promise<string[]>;
  getLatestVersion(name: string): Promise<string | null>;
  getSchemas(name: string, version: string): Promise<Schema[]>;
  getSchema(name: string, version: string, schemaName: string): Promise<Schema>;
  
  // Search
  searchByCapability(capability: string): Promise<ServiceInfo[]>;
  searchByBoundedContext(context: string): Promise<ServiceInfo[]>;
  
  // Unpublishing
  deleteService(name: string, version: string): Promise<void>;
  
  // Lifecycle
  initialize(): Promise<void>;
  close(): Promise<void>;
}
```

**Implementation Structure**:

```text
src/storage/
├── IStorageProvider.ts           # Interface (open for extension)
├── SqliteStorageProvider.ts      # PoC implementation
├── PostgresS3StorageProvider.ts  # Production implementation (future)
└── StorageFactory.ts             # Factory pattern for provider selection
```

**Factory Pattern**:

```typescript
// src/storage/StorageFactory.ts
export class StorageFactory {
  static create(config: StorageConfig): IStorageProvider {
    switch (config.provider) {
      case 'sqlite':
        return new SqliteStorageProvider(config.sqlitePath);
      case 'postgres':
        return new PostgresS3StorageProvider(config.postgres, config.s3);
      default:
        throw new Error(`Unknown storage provider: ${config.provider}`);
    }
  }
}
```

**Environment-Based Selection** (per ADR-034):

```bash
# PoC
STORAGE_PROVIDER=sqlite
SQLITE_PATH=/data/repository.db

# Production
STORAGE_PROVIDER=postgres
POSTGRES_URL=postgresql://user:pass@host:5432/spas
S3_BUCKET=spas-schemas
S3_REGION=us-east-1
```

**Migration Strategy**:

1. PoC Phase: Implement `SqliteStorageProvider` with full interface
2. Test all user stories against SQLite implementation
3. Production Phase: Implement `PostgresS3StorageProvider` with identical interface
4. Switch via environment variable (zero code changes in business logic)
5. Validation: Run same test suite against both providers

**Dependencies**:

- PoC: `better-sqlite3` (synchronous, high-performance SQLite binding)
- Production: `pg` (node-postgres), `@aws-sdk/client-s3`

Decision: ✅ **Storage abstraction required** (2025-12-13)

- Rationale: Enables PoC-to-Production migration without violating Open-Closed Principle; testable via dependency injection; environment-driven configuration per ADR-034

## Decision Log (running)

- 2025-12-13: Clarified checksum delivery as multipart part `checksum`. Added FR-008a, FR-034a.
- 2025-12-13: **Language Decision** - Node.js 20 + Fastify for PoC (speed, proven in sidecar prototype, excellent async I/O)
- 2025-12-13: **Dependencies** - Ajv (JSON Schema), unzipper (archives), pino (logging), OpenTelemetry Node.js SDK (traces), better-sqlite3 (PoC storage)
- 2025-12-13: **Storage** - SQLite (PoC) for ACID transactions and JSON queries; PostgreSQL (JSONB) + S3 for production migration. Abstraction layer (IStorageProvider) required per Open-Closed Principle.
- 2025-12-13: **Testing** - Jest with ts-jest; >80% coverage; unit + integration tests; structured test organization
- 2025-12-13: **TypeScript** - Strict mode enabled; npm package manager; ES2022 target
- 2025-12-13: **Docker** - Multi-stage Alpine build; env var config (PORT, DATA_DIR, LOG_LEVEL, ZIPKIN_URL, SPAS_SCHEMA_PATH); /data volume mount

## Recommendation (final)

- Node.js 20 + Fastify for PoC
  - Reasons: Strong JSON/ZIP tooling, fast iteration, minimal overhead
- SQLite for storage with IStorageProvider abstraction
  - Reasons: ACID transactions, native JSON queries, easier migration to PostgreSQL than file-based
- Use Ajv for JSON Schema; add custom rule checks based on SPAS governance

Status: ✅ **DECIDED** (2025-12-13) — Language: Node.js 20 + Fastify; Storage: SQLite (PoC), PostgreSQL + S3 (Production); Abstraction: IStorageProvider interface
