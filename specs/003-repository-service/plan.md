# Implementation Plan: SPAS Repository Service

**Branch**: `003-repository-service` | **Date**: December 13, 2025 | **Spec**: specs/003-repository-service/spec.md
**Input**: Feature specification from `/specs/003-repository-service/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a PoC Repository Service that publishes and serves canonical service metadata (`spas.json`) and schemas. API is HTTP `/v1` with path-keyed `POST /services/{serviceName}:{version}` accepting `multipart/form-data` with `archive` (ZIP). Storage is file-based for PoC; production targets a document store + object storage. Validation covers schema correctness, duplicate protection, archive integrity, and identity matching.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: NEEDS CLARIFICATION (options: .NET 10 minimal API, Node.js 20 Express/Fastify, Python 3.11 FastAPI)
**Primary Dependencies**: NEEDS CLARIFICATION (zip handling, JSON Schema validation, OpenAPI generator)
**Storage**: PoC: Files (local volume). Production: NEEDS CLARIFICATION (PostgreSQL JSONB + S3-compatible object store)
**Testing**: NEEDS CLARIFICATION (xUnit/NUnit, Jest, or pytest). Unit tests mandatory per Constitution.
**Target Platform**: Linux/Windows dev; containerized runtime
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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: Single backend service with tests; exact language TBD after Phase 0 dialog.

Proposed (language-agnostic):

```text
repo-service/
├── src/
│   ├── api/            # controllers/routes
│   ├── core/           # domain + validation
│   ├── storage/        # file-based PoC, interface for production backends
│   └── schemas/        # JSON Schema validation utilities
├── tests/
│   ├── unit/
│   └── integration/
└── Dockerfile
```

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
