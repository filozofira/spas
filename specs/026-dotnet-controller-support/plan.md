# Implementation Plan: .NET SDK Controller Metadata Support

**Branch**: `026-dotnet-controller-support` | **Date**: 2025-12-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/026-dotnet-controller-support/spec.md`

## Summary

Extend .NET SDK metadata generation to support ASP.NET Core MVC Controllers alongside existing Minimal API support, achieving feature parity with Java SDK. The implementation adds controller action discovery via `IActionDescriptorCollectionProvider` while preserving all existing Minimal API functionality. This is a **NON-BREAKING EXTENSION** that enables teams using Controllers to adopt SPAS without refactoring to Minimal APIs.

**Key Technical Approach**:
1. Add controller action discovery method that inspects `ControllerActionDescriptor` objects
2. Extract route templates by combining class-level `[Route]` and method-level HTTP attributes
3. Infer request/response schemas from controller parameters and return types (same logic as Minimal API schema inference from feature 023)
4. Update documentation and CLI templates to reflect both patterns

## Technical Context

**Language/Version**: C# / .NET 10.0  
**Primary Dependencies**: ASP.NET Core MVC (`Microsoft.AspNetCore.Mvc.Core`), NJsonSchema 11.1.0, existing SDK dependencies  
**Storage**: N/A (metadata generation only)  
**Testing**: xUnit, existing SDK test infrastructure  
**Target Platform**: .NET 10.0 (cross-platform, Linux/Windows/macOS)
**Project Type**: SDK library (multi-project solution)  
**Performance Goals**: Metadata generation <5 seconds (same as Minimal API, per SC-001)  
**Constraints**: MUST NOT break existing Minimal API functionality; 100% backward compatible  
**Scale/Scope**: 1 SDK project (Spas.Sdk.Metadata), ~3 test projects, ~6 example services, CLI template files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Implementation Check (Before Phase 0)

| Principle | Status | Notes |
|-----------|--------|-------|
| SDK: Offline Design-time Metadata | ✅ Pass | No change to offline generation model; controllers discovered same way |
| SDK: No External Infrastructure | ✅ Pass | No new infrastructure dependencies; uses ASP.NET Core's built-in `IActionDescriptorCollectionProvider` |
| SDK: Events Preparation vs Wrapping | ✅ Pass | SDK prepares payload; sidecar wraps. No change to event boundary. |
| SDK: Quality Gates | ✅ Pass | Unit tests required (≥80% coverage); integration tests for metadata round-trip |
| SDK: Mandatory Capabilities | ✅ Pass | Metadata authoring enhanced (extended), not reduced |
| SDK: Non-Breaking Extension | ✅ Pass | Spec explicitly requires preservation of all existing Minimal API functionality |

**Constitution Gate**: PASSED — No violations detected. This is a pure additive extension.

### Post-Design Check (After Phase 1)

| Principle | Status | Notes |
|-----------|--------|-------|
| SDK: Offline Design-time Metadata | ✅ Pass | Design maintains offline generation; `quickstart.md` shows `--generate-metadata` CLI usage unchanged |
| SDK: No External Infrastructure | ✅ Pass | Design uses only ASP.NET Core's built-in services (`IActionDescriptorCollectionProvider`); no external dependencies added |
| SDK: Events Preparation vs Wrapping | ✅ Pass | Quickstart examples show same event publishing pattern for controllers (`IEventPublisher.PublishAsync`) as Minimal APIs |
| SDK: Quality Gates | ✅ Pass | Research document specifies three-tier testing strategy (unit, integration, regression) with 80% coverage target |
| SDK: Mandatory Capabilities | ✅ Pass | Design extends metadata authoring to controllers without removing any Minimal API capabilities |
| SDK: Non-Breaking Extension | ✅ Pass | Quickstart demonstrates both patterns work side-by-side; mixed usage explicitly supported |

**Constitution Gate**: PASSED (Re-Validated) — Design artifacts confirm no principle violations. Implementation can proceed to Phase 2.

## Project Structure

### Documentation (this feature)

```text
specs/026-dotnet-controller-support/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file
├── research.md          # Phase 0 output (route resolution patterns, schema inference strategy)
├── data-model.md        # Phase 1 output (N/A - no data model, internal SDK change)
├── quickstart.md        # Phase 1 output (controller usage examples)
├── checklists/          # Quality gates
│   └── requirements.md  # Specification quality checklist (completed)
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (existing structure - modifications only)

```text
components/sdk/dotnet/
├── src/
│   └── Spas.Sdk.Metadata/                      # Main project for this feature
│       ├── Attributes/
│       │   └── SpasContractAttributes.cs       # ← MODIFY: Fix misleading comments (FR-011)
│       ├── Discovery/
│       │   └── MetadataDiscovery.cs            # (no changes expected)
│       ├── Extensions/
│       │   └── WebApplicationDiscoveryExtensions.cs  # ← MODIFY: Add DiscoverControllerActions() method (FR-001, FR-002, FR-003)
│       ├── Generation/
│       │   └── MetadataArchiveGenerator.cs     # ← MODIFY: Support controller-sourced schemas (FR-006, FR-007)
│       ├── Schema/
│       │   └── SchemaGenerator.cs              # (likely reusable as-is from feature 023)
│       └── Builders/
│           └── ContractsBuilder.cs             # (may need minor extension for controller context)
├── test/
│   └── Spas.Sdk.Metadata.Tests/                # ← ADD: Controller discovery tests
│       └── ControllerDiscoveryTests.cs         # New test file for US1, US2, US3, US4
└── examples/
    └── SampleService/
        ├── Controllers/                         # ← ADD: Example controller
        │   └── OrdersController.cs             # New controller demonstrating [SpasCommand]/[SpasQuery]
        └── Program.cs                          # ← MODIFY: Add AddControllers() if not present

components/sdk/dotnet/
└── README.md                                    # ← MODIFY: Update "Minimal APIs only" section (FR-011)

components/cli/spas-service/
└── templates/                                   # ← MODIFY: Update agent prompts to mention controllers (FR-012, FR-015)
    ├── agent-prompt.eta                         # Update to remove Minimal API restrictions
    └── partials/
        └── sdk-patterns.eta                     # Update with controller examples alongside Minimal API

examples/services/
└── order-service/                               # ← MODIFY: Add controller example alongside existing Minimal API (FR-012)
    ├── Controllers/
    │   └── OrdersController.cs                  # New example controller
    └── Program.cs                               # Update to show AddControllers()/MapControllers()

.github/agents/
└── copilot-instructions.md                      # ← MODIFY: Remove "Minimal APIs only" restrictions (FR-011)
```

**Structure Decision**: Existing SDK project structure maintained. Changes are internal to `Spas.Sdk.Metadata` project with new controller discovery method added alongside existing minimal API discovery. Test files and examples extended to cover both patterns.

## Complexity Tracking

> Constitution Check passed with no violations. No complexity justifications required.

---

## Implementation Details

### Phase 0: Research

Document the specific approach for controller integration with existing minimal API discovery:

- **Route template resolution**: How ASP.NET Core combines class-level `[Route]` and method-level HTTP verb attributes
- **ActionDescriptor access**: How to retrieve `IActionDescriptorCollectionProvider` from WebApplication's service provider
- **Schema inference reuse**: Confirm feature 023's schema inference logic works for controller parameters/return types
- **Route token resolution**: How `[controller]` and `[action]` tokens are resolved in attribute routes
- **Testing strategy**: Identify test patterns that verify both Minimal API and Controller discovery work together

**Output**: `research.md`

### Phase 1: Design

Design the controller discovery integration:

**Data Model** (N/A for this feature - no domain entities, internal SDK change only):
- Document the `ControllerActionDescriptor` structure and how it maps to `ContractsBuilder`

**API Contracts** (N/A for this feature - internal SDK implementation):
- Document the signature of the new `DiscoverControllerActions()` method
- Define how controller-sourced metadata integrates with existing `ContractsBuilder`

**Quickstart Guide**:
- Provide side-by-side examples showing Minimal API vs Controller patterns
- Migration guide for teams wanting to add Controllers to existing Minimal API services
- Common pitfalls (missing `AddControllers()`, convention routing not supported, etc.)

**Output**: `quickstart.md` (data-model.md skipped, contracts/ skipped)

### Phase 2: User Story 1 - Controller Metadata Discovery (Priority: P1) 🎯 MVP

**Goal**: Discover controller actions annotated with `[SpasCommand]` or `[SpasQuery]` and generate endpoint contracts.

**Technical Approach**:
1. Modify `WebApplicationDiscoveryExtensions.cs`:
   - Add `DiscoverControllerActions(WebApplication app, ContractsBuilder builder)` method
   - Access `IActionDescriptorCollectionProvider` from `app.Services`
   - Iterate through action descriptors, filtering for `ControllerActionDescriptor`
   - Check each `MethodInfo` for `[SpasCommand]` or `[SpasQuery]` attributes
2. Extract route template from `AttributeRouteInfo.Template` property
3. Extract HTTP verb from HTTP method metadata
4. Call existing `ContractsBuilder` methods to add endpoints

**Independent Test**: Create test service with controller actions, run metadata generation, verify archive contents.

- **T001**: Add `DiscoverControllerActions()` method to `WebApplicationDiscoveryExtensions.cs`
- **T002**: Implement route template extraction from `ControllerActionDescriptor.AttributeRouteInfo`
- **T003**: Implement HTTP verb extraction from action metadata
- **T004**: Integrate controller discovery into `DiscoverSpasMetadata()` call flow
- **T005**: Add unit tests for controller discovery with basic routes
- **T006**: Add unit tests for route parameter handling (`{id}`, `{id?}`, etc.)
- **T007**: Add unit tests for class + method level route combination

### Phase 3: User Story 2 - Mixed Routing Support (Priority: P2)

**Goal**: Support services using both Minimal APIs and Controllers, generating unified metadata.

**Technical Approach**:
1. Ensure `DiscoverSpasMetadata()` calls both existing minimal API discovery AND new controller discovery
2. Add duplicate endpoint name detection in `ContractsBuilder`
3. Test that route patterns can overlap without conflict (different endpoint names)

**Independent Test**: Create service with both patterns, verify all endpoints discovered.

- **T008**: Ensure both discovery methods are called in sequence
- **T009**: Add validation for duplicate endpoint names
- **T010**: Add integration test with mixed Minimal API + Controller service
- **T011**: Verify metadata structure is identical regardless of source

### Phase 4: User Story 3 - Schema Inference from Controllers (Priority: P2)

**Goal**: Infer request/response schemas from controller action parameters and return types.

**Technical Approach**:
1. Reuse schema inference logic from feature 023 (endpoint-command-inference)
2. Extract parameter types from `ControllerActionDescriptor.Parameters` (look for `[FromBody]`)
3. Extract return type from `MethodInfo.ReturnType`, unwrapping `ActionResult<T>`, `Task<T>`, etc.
4. Store request body type in `ContractsBuilder` for later schema generation

**Independent Test**: Create controller with DTO parameters/returns, verify schemas generated.

- **T012**: Add parameter type extraction for controller actions
- **T013**: Add return type extraction with wrapper unwrapping
- **T014**: Integrate with existing schema generation pipeline
- **T015**: Add unit tests for schema inference from `[FromBody]` parameters
- **T016**: Add unit tests for return type unwrapping (`ActionResult<T>`, `Task<IActionResult>`, etc.)
- **T017**: Add integration test verifying generated schema files match DTO structure

### Phase 5: User Story 4 - Event Production from Controllers (Priority: P3)

**Goal**: Support `Produces` property on `[SpasCommand]` for controller actions.

**Technical Approach**:
1. Extract `Produces` property from `SpasCommandAttribute` on controller methods
2. Reuse existing event resolution logic (same as Minimal API)
3. Add validation that produced event types have `[SpasEvent]` attribute

**Independent Test**: Create controller command with `Produces`, verify event references in metadata.

- **T018**: Extract `Produces` property from controller command attributes
- **T019**: Validate produced event types have `[SpasEvent]`
- **T020**: Add unit tests for single and multiple produced events
- **T021**: Add unit tests for validation failure on invalid event types

### Phase 6: Documentation and Template Updates (FR-011, FR-012, FR-015)

**Goal**: Update all documentation to reflect controller support and remove misleading claims.

**Independent Test**: Audit completed; no "Minimal APIs only" restrictions remain.

- **T022**: Fix code comments in `SpasContractAttributes.cs` (lines 21, 70)
- **T023**: Update SDK `README.md` to show both Minimal API and Controller examples
- **T024**: Update CLI templates in `components/cli/spas-service/templates/` to include controller examples
- **T025**: Update `.github/agents/copilot-instructions.md` to remove Minimal API restrictions
- **T026**: Add controller example to `SampleService` project
- **T027**: Search codebase for remaining "Minimal APIs only" references and update
- **T028**: Update agent prompts in CLI templates to mention both patterns

### Phase 7: Integration Testing and Validation (SC-002, SC-003, SC-004)

**Goal**: Ensure all existing tests pass and new functionality is validated end-to-end.

**Independent Test**: Full test suite passes with 100% success rate.

- **T029**: Run existing Minimal API tests, confirm 100% pass rate
- **T030**: Run new controller tests, confirm all pass
- **T031**: Run mixed-mode integration tests
- **T032**: Validate generated metadata structure is identical for both patterns
- **T033**: Performance test: metadata generation <5 seconds for controller-based service
- **T034**: Generate metadata from example service with controllers, inspect archive manually

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Breaking existing Minimal API functionality | Critical | Comprehensive regression test suite; run all existing tests first |
| Route resolution differs from Minimal API | High | Research phase documents ASP.NET Core route resolution; match existing behavior |
| Performance regression from dual discovery | Medium | Benchmark metadata generation time; ensure <5s threshold met |
| Incomplete documentation updates | Medium | Systematic search for "Minimal APIs only" across codebase; create checklist |
| Schema inference inconsistency | High | Reuse feature 023 logic; add tests comparing Minimal API vs Controller schema output |

---

## Dependencies

- **Feature 001** (dotnet-spas-sdk): Core SDK infrastructure
- **Feature 021** (SDK Metadata Archive Extraction): Offline generation infrastructure
- **Feature 023** (Endpoint Command Inference): Schema inference patterns to reuse

---

## Success Criteria Mapping

| Success Criterion | Validation Method | Phase |
|-------------------|-------------------|-------|
| SC-001: <5s generation time | Performance test (T033) | Phase 7 |
| SC-002: 100% existing test pass rate | Regression tests (T029) | Phase 7 |
| SC-003: Byte-identical metadata structure | Structure comparison test (T032) | Phase 7 |
| SC-004: Mixed services work without errors | Integration test (T010) | Phase 3 |
| SC-005: Documentation shows both patterns | Manual review (T023, T026) | Phase 6 |
| SC-006: Zero false claims remain | Documentation audit (T027) | Phase 6 |
| SC-007: CLI templates include controllers | Template review (T024) | Phase 6 |
