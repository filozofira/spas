# Implementation Plan: SPAS Repository Service

**Branch**: `003-repository-service` | **Date**: December 13, 2025 | **Spec**: specs/003-repository-service/spec.md
**Input**: Feature specification from `/specs/003-repository-service/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a PoC Repository Service that publishes and serves canonical service metadata (`spas.json`) and schemas. API is HTTP `/v1` with path-keyed `POST /services/{serviceName}:{version}` accepting `multipart/form-data` with `archive` (ZIP). Storage uses SQLite (embedded, ACID) for PoC with abstraction layer (IStorageProvider) enabling migration to PostgreSQL + S3 for production. Validation covers schema correctness, duplicate protection, archive integrity, and identity matching.

## Technical Context

**Language/Version**: Node.js 20 LTS with TypeScript (strict mode)
**Primary Dependencies**: Fastify (HTTP framework), Ajv (JSON Schema validation), unzipper (archive handling), pino (structured logging), better-sqlite3 (PoC storage)
**Storage**: PoC: SQLite (embedded, ACID transactions, JSON queries). Production: PostgreSQL (JSONB) + S3-compatible object store. **REQUIRED**: Storage abstraction layer (IStorageProvider interface) to enable PoC-to-Production migration without code changes (Open-Closed Principle).
**Testing**: Jest with ts-jest. Unit tests mandatory per Constitution (>80% coverage target). Integration tests for end-to-end API flows. Test structure: unit/ (validation, storage, services), integration/ (publish, retrieve, search), fixtures/ (sample archives).
**Target Platform**: Linux/Windows dev; containerized runtime (Docker multi-stage Alpine build)
**Project Type**: Web service (single backend)
**Performance Goals**: PoC targets from spec: publish ≤5s (<10MB), retrieve ≤2s
**Constraints**: Offline-capable, path authority for identity, additive-only schema evolution
**Scale/Scope**: Catalog up to ~1000 services in PoC

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Single bounded context per service: Enforced via `spas.json` validation (OK)
- No direct service-to-service: Repository is infra service (N/A)
- Event-first: Not applicable to repository API (documented)
- Convention over configuration: Path-keyed identity aligns with CLI (OK)
- Security by default: PoC simplifies auth; production OIDC/RBAC (documented)
- Observability: Structured logs + trace context (to design)

Status: Pass with PoC simplifications per Constitution.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
components/repository/
├── src/
│   ├── routes/         # Fastify route handlers
│   ├── services/       # Business logic (publish, retrieve, search)
│   ├── storage/        # Storage abstraction (Open-Closed Principle)
│   │   ├── IStorageProvider.ts           # Interface definition
│   │   ├── SqliteStorageProvider.ts      # PoC implementation
│   │   ├── PostgresS3StorageProvider.ts  # Production (future)
│   │   └── StorageFactory.ts             # Provider selection
│   ├── validation/     # JSON Schema validation (Ajv), schema evolution checks
│   └── models/         # TypeScript interfaces/types
├── test/
│   ├── unit/           # Jest unit tests per user story
│   │   └── storage/    # Storage provider tests (interface compliance)
│   └── integration/    # End-to-end API tests
├── data/
│   └── repository.db   # SQLite database (PoC, volume-mounted)
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```
