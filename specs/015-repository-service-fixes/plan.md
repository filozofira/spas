# Implementation Plan: Repository Service Enhancements

**Branch**: `015-repository-service-fixes` | **Date**: December 19, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-repository-service-fixes/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Extend the SPAS repository service with two enhancements:
1. **Unfiltered Service List**: Add `GET /services` endpoint that returns all services without requiring capability or boundedContext filters, enabling complete service inventory discovery
2. **Schema Version Fix**: Correct bug where retrieved service metadata shows `"schemaVersion": "design-time-metadata-v1"` instead of `"runtime-metadata-v1"` for services pulled from the repository

Both changes maintain 100% backward compatibility with existing filtered search endpoints and follow established patterns in the TypeScript/Fastify codebase.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.9.3, Node.js ES2022 target  
**Primary Dependencies**: Fastify 5.6.2, better-sqlite3 12.5.0, ajv 8.17.1 for validation  
**Storage**: SQLite database with existing schema, no migrations required  
**Testing**: Jest 30.2.0 with ts-jest, existing test patterns and utilities  
**Target Platform**: Linux server containers, Docker Compose + Kubernetes
**Project Type**: Single backend service (REST API)  
**Performance Goals**: <2 seconds response for up to 100 services, maintain existing endpoint performance  
**Constraints**: Zero breaking changes, maintain existing API contracts, backward compatibility  
**Scale/Scope**: Enhancement to existing ~2k LOC service, affecting 2 endpoints + shared metadata transformation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**✅ I. Single Bounded Context Per Service**: Repository service maintains its bounded context (service metadata management). No changes to bounded context scope.

**✅ II. No Direct Service-to-Service Communication**: Repository service accepts HTTP requests from external clients (CLI tools, developers). No service-to-service calls introduced.

**✅ III. Event-First Integration**: Repository service is a synchronous query service by design. No event integration requirements for metadata repository functionality.

**✅ IV. Convention Over Configuration**: Repository service follows existing SPAS naming conventions. No hostname or routing convention changes.

**✅ V. Security by Default**: Repository service maintains existing security patterns. No new security requirements for metadata endpoints.

**✅ VI. Observability First**: Repository service maintains existing health endpoints, logging, and tracing patterns. No observability changes required.

**✅ VII. Portable Packaging**: Repository service maintains existing OCI container packaging. No packaging changes required.

**✅ VIII. Adaptable Through Configuration**: Repository service exposes metadata schemas without domain-specific logic. No configuration adaptability impact.

**Result**: ✅ **PASS** - No constitutional violations detected. Feature enhances existing repository service without violating core SPAS principles.

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
│   ├── models/
│   │   └── types.ts           # ServiceMetadata, SearchResults interfaces
│   ├── routes/
│   │   ├── search.ts          # MODIFY: Handle unfiltered /services requests  
│   │   ├── retrieve.ts        # MODIFY: Fix schema version in responses
│   │   ├── publish.ts         # No changes required
│   │   └── unpublish.ts       # No changes required
│   ├── services/
│   │   ├── SearchService.ts   # MODIFY: Add getAllServices() method
│   │   └── RetrievalService.ts # MODIFY: Fix schema version transformation
│   ├── storage/               # No changes required - existing SQLite patterns
│   ├── validation/            # No changes required
│   ├── config.ts             # No changes required
│   └── index.ts              # No changes required
├── test/
│   ├── unit/
│   │   ├── routes/
│   │   │   ├── search.test.ts     # ADD: Tests for unfiltered endpoint
│   │   │   └── retrieve.test.ts   # MODIFY: Tests for schema version fix
│   │   └── services/
│   │       ├── SearchService.test.ts    # ADD: Tests for getAllServices()
│   │       └── RetrievalService.test.ts # MODIFY: Schema version tests
│   ├── integration/
│   │   └── api.test.ts        # MODIFY: Integration tests for both features
│   └── scripts/
│       └── create-fixtures.js # No changes required
├── package.json              # No changes required
├── tsconfig.json             # No changes required
└── docker-compose.yml        # No changes required
```

**Structure Decision**: Single backend service enhancement. Modifying existing TypeScript/Fastify repository service within `components/repository/` to add unfiltered listing capability and fix schema version bug. No new services or major structural changes required.

## Phase 0: Research & Analysis

**Status**: Ready to proceed - No unknowns requiring research

All technical context is well-understood:
- Existing TypeScript/Fastify patterns for route handling  
- Current SearchService and RetrievalService architecture
- SQLite storage interface and query patterns
- Schema version transformation requirements
- Test patterns and utilities already established

**Next Step**: Proceed directly to Phase 1 (Design & Contracts)
