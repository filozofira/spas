# Implementation Plan: Product CRUD Operations with Event Emission

**Branch**: `001-product-crud-operations` | **Date**: 2026-01-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-product-crud-operations/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Extend the example product-service to support full CRUD operations (Create, Read, Update, Delete) with corresponding domain event emissions. The service currently supports read-only operations (GET /products, GET /products/{id}). This feature adds:

- **POST /products** - Add new products with validation (ProductAdded event)
- **PATCH /products/{id}** - Partial update of product fields (ProductUpdated event with change tracking)
- **DELETE /products/{id}** - Remove products from catalog (ProductRemoved event)

All operations emit events through the SPAS sidecar on a best-effort basis. The service uses in-memory storage (ConcurrentDictionary) consistent with its example/demonstration purpose.

## Technical Context

**Language/Version**: C# / .NET 10.0  
**Primary Dependencies**: ASP.NET Core, SPAS .NET SDK (Metadata, Events, Observability, Inbound)  
**Storage**: In-memory (ConcurrentDictionary) - example service, no external database  
**Testing**: xUnit (follow existing test patterns in SPAS repository)  
**Target Platform**: Linux containers (OCI), Docker Compose, Kubernetes  
**Project Type**: Single service (extends existing examples/services/product-service)  
**Performance Goals**: <100ms p95 for CRUD operations, <1s event emission  
**Constraints**: Stateless operation (example service), no concurrency control needed  
**Scale/Scope**: Example/demo service with ~5-20 products for demonstration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Validation

✅ **I. Single Bounded Context**: Service maintains single "product-catalog" bounded context (no change)

✅ **II. No Direct Service Communication**: No service-to-service calls added; events flow through sidecar

✅ **III. Event-First Integration**: All state changes (add/update/remove) emit domain events via sidecar

✅ **IV. Convention Over Configuration**: Maintains existing `SERVICE_NAME=product-service`, sidecar conventions

✅ **V. Security by Default**: Maintains W3C Trace Context propagation (existing SDK patterns)

✅ **VI. Observability First**: Maintains health endpoints, adds tracing for new operations via SDK

✅ **VII. Portable Packaging**: No packaging changes; service remains containerized example

✅ **VIII. Adaptable Through Configuration**: Service schema unchanged; events routed via choreography

### PoC Mode Applicability

✅ This is an **example/demo service** - PoC patterns apply:
- In-memory storage acceptable (no production DB)
- No complex concurrency control needed
- Best-effort event delivery (logged failures, no retries)
- Testing focuses on demonstrating patterns

### Gates Summary

**Status**: ✅ **PASS** - All constitution principles satisfied. No violations require justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-product-crud-operations/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - SPAS SDK patterns, event design
├── data-model.md        # Phase 1 output - Product entity, event schemas
├── quickstart.md        # Phase 1 output - Usage examples for new operations
└── contracts/           # Phase 1 output - OpenAPI spec for new endpoints
    └── product-service.openapi.yaml
```

### Source Code (extends existing service)

```text
examples/services/product-service/
├── Controllers/
│   └── ProductsController.cs        # [EXTEND] Add POST, PATCH, DELETE endpoints
├── Services/
│   └── ProductCatalog.cs            # [EXTEND] Add Add(), Update(), Remove() methods
├── Models/
│   ├── Product.cs                   # [UNCHANGED] Existing record
│   ├── AddProductRequest.cs         # [NEW] DTO for POST
│   ├── UpdateProductRequest.cs      # [NEW] DTO for PATCH (partial)
│   └── Events/                      # [NEW DIRECTORY]
│       ├── ProductAdded.cs          # [NEW] Event model
│       ├── ProductUpdated.cs        # [NEW] Event model (with change tracking)
│       └── ProductRemoved.cs        # [NEW] Event model
├── Validation/                      # [NEW DIRECTORY]
│   └── ProductValidator.cs          # [NEW] Validation logic (lengths, format, price)
├── Program.cs                       # [EXTEND] Register EventPublisher, validators
├── ProductService.csproj            # [UNCHANGED] Dependencies already present
├── README.md                        # [EXTEND] Document new endpoints, events
└── metadata/
    └── service.metadata.zip         # [REGENERATE] After adding new capabilities

tests/                                # [NEW - if not exists, create test project]
└── ProductService.Tests/
    ├── Controllers/
    │   └── ProductsControllerTests.cs  # [NEW] Test CRUD operations
    ├── Services/
    │   └── ProductCatalogTests.cs      # [NEW] Test business logic
    └── Validation/
        └── ProductValidatorTests.cs    # [NEW] Test validation rules
```

**Structure Decision**: Extends existing single-service structure. No new projects needed. All SPAS SDK dependencies already referenced. Event models follow SPAS SDK patterns with [SpasEvent] attributes.

## Phase 0: Research & Resolution

### Research Topics

No research required - all clarifications resolved during `/speckit.clarify`:

1. **Concurrency handling**: Not needed (example service)
2. **Event delivery guarantees**: Best-effort (operation succeeds, failures logged)
3. **Field length constraints**: Name max 200 chars, Description max 2000 chars
4. **Update semantics**: Partial updates (PATCH) - only changed fields provided
5. **Product ID format**: Lowercase alphanumeric with hyphens, 1-50 characters

### Technology Decisions (from existing codebase)

| Decision | Rationale |
|----------|-----------|
| In-memory storage | Example service demonstrates patterns without infrastructure complexity |
| ConcurrentDictionary | Thread-safe, simple, already used in existing ProductCatalog |
| SPAS .NET SDK Events | Standard SDK pattern for event emission via sidecar |
| [SpasEvent] attributes | Enables metadata generation, type safety, discoverability |
| Controller-based endpoints | Consistent with existing ProductsController pattern |
| Best-effort events | Aligns with PoC mode; demonstrates pattern without retry complexity |

### SPAS SDK Patterns

**Event Publishing** (from SDK analysis):
- Use `EventPublisher` injected via DI
- Events decorated with `[SpasEvent("event-name", "version")]`
- SDK sends headers (traceparent, x-service-name, x-event-name) + JSON payload
- Sidecar wraps in CloudEvents format and routes to topics
- Best-effort: log failures, don't block operations

**Metadata Generation**:
- Commands use `[SpasCommand]` attributes
- Queries use `[SpasQuery]` attributes  
- Events use `[SpasEvent]` attributes
- Regenerate metadata.zip after adding new capabilities

**Validation Patterns**:
- ASP.NET Core ModelState validation
- Custom validators for business rules
- Return 400 with validation details on errors

## Phase 1: Design & Contracts

### Data Model

**Output**: [data-model.md](data-model.md)

**Entities**:
- **Product**: Existing entity (productId, name, category, price, description) with validation constraints
- **AddProductRequest**: DTO for creating products with all required fields
- **UpdateProductRequest**: DTO for partial updates (all fields optional)

**Events**:
- **ProductAdded**: Complete product data on creation
- **ProductUpdated**: Product ID + changes object with old/new values for modified fields
- **ProductRemoved**: Complete product data at time of removal

**Storage**: ConcurrentDictionary<string, Product> for thread-safe in-memory operations

### API Contracts

**Output**: [contracts/product-service.openapi.yaml](contracts/product-service.openapi.yaml)

**New Endpoints**:
- `POST /products` → 201 Created, 400 Validation, 409 Conflict
- `PATCH /products/{id}` → 200 OK, 400 Validation, 404 Not Found
- `DELETE /products/{id}` → 204 No Content, 404 Not Found

**Existing Endpoints** (unchanged):
- `GET /products` → 200 OK
- `GET /products/{id}` → 200 OK, 404 Not Found
- `GET /health` → 200 OK

### Quickstart Guide

**Output**: [quickstart.md](quickstart.md)

Provides:
- curl examples for all CRUD operations
- Validation error examples
- Event emission details
- Testing workflow
- Troubleshooting guide

### Agent Context Update

**Completed**: Ran `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`

Added to Copilot context:
- C# / .NET 10.0
- ASP.NET Core, SPAS .NET SDK
- In-memory storage pattern
- Example service structure

## Constitution Re-Check (Post-Design)

**Status**: ✅ **PASS** - Design maintains full compliance

- Event schemas follow CloudEvents 1.0 via SDK (wrapped by sidecar)
- REST API follows standard HTTP semantics
- Partial update pattern (PATCH) is industry standard
- Validation rules prevent invalid states
- In-memory storage appropriate for example service
- No new infrastructure dependencies

## Summary & Next Steps

### Completed Artifacts

✅ **Phase 0 - Research**:
- [research.md](research.md) - Technology decisions, SPAS SDK patterns, event schemas

✅ **Phase 1 - Design**:
- [data-model.md](data-model.md) - Entities, events, validation rules
- [contracts/product-service.openapi.yaml](contracts/product-service.openapi.yaml) - OpenAPI 3.0 specification
- [quickstart.md](quickstart.md) - Usage guide with examples
- Agent context updated (Copilot)

### Ready for Implementation

The planning phase is complete. All design artifacts generated. Next phase:

**`/speckit.tasks`** - Generate implementation tasks from this plan

The implementation will:
1. Extend ProductCatalog with Add(), Update(), Remove() methods
2. Add new controller endpoints with proper attributes
3. Create request/response DTOs with validation
4. Define event models with [SpasEvent] attributes
5. Wire up EventPublisher in DI container
6. Add unit tests for new functionality
7. Update README and regenerate metadata
8. Test end-to-end with sidecar integration

### Branch & Paths

- **Branch**: `001-product-crud-operations`
- **Plan**: `specs/001-product-crud-operations/plan.md`
- **Source**: `examples/services/product-service/`
- **Tests**: `tests/ProductService.Tests/` (to be created)
