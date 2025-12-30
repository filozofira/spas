# Feature Specification: .NET SDK Controller Metadata Support

**Feature Branch**: `026-dotnet-controller-support`  
**Created**: 2025-12-30  
**Status**: Draft  
**Input**: User description: "Extend .NET SDK metadata generation to support Controllers. Currently it supports only Minimal API."

## Overview

The .NET SDK currently generates metadata only from Minimal API endpoints (registered via `app.MapPost()`, `app.MapGet()`, etc.). This feature extends metadata discovery to include ASP.NET Core MVC Controllers, bringing feature parity with the Java SDK which fully supports controller-based routing via Spring's `@RestController`.

**Key Constraint**: This is a **NON-BREAKING EXTENSION**. All existing Minimal API functionality must continue to work exactly as before. Controller support is additive.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Controller Metadata Discovery (Priority: P1) 🎯 MVP

.NET developers using ASP.NET Core Controllers can annotate controller actions with `[SpasCommand]` and `[SpasQuery]` attributes, and the SDK automatically discovers these endpoints during offline metadata generation, producing the same metadata structure as Minimal API endpoints.

**Why this priority**: Achieves feature parity with Java SDK and enables teams already using Controllers to adopt SPAS without refactoring to Minimal APIs. This is the core value of the feature.

**Independent Test**: Create a service with controller actions annotated with `[SpasCommand]` and `[SpasQuery]`, run metadata generation with `--generate-metadata`, and verify the generated `service.metadata.zip` contains correct endpoint contracts.

**Acceptance Scenarios**:

1. **Given** a controller with `[SpasCommand("CreateOrder", "1.0")]` on a POST action, **When** metadata generation runs, **Then** the archive contains an endpoint contract with name "create-order", type "Command", and correct HTTP path
2. **Given** a controller with `[SpasQuery("GetOrder", "1.0")]` on a GET action, **When** metadata generation runs, **Then** the archive contains an endpoint contract with name "get-order", type "Query", and correct HTTP path
3. **Given** a controller with both class-level `[Route("api/[controller]")]` and method-level `[HttpPost]`, **When** metadata generation runs, **Then** the endpoint path is correctly resolved as "/api/orders"
4. **Given** a controller with `[HttpGet("{id}")]`, **When** metadata generation runs, **Then** the path includes route parameters: "/api/orders/{id}"

---

### User Story 2 - Mixed Routing Support (Priority: P2)

.NET developers can use both Minimal APIs and Controllers in the same service, and the SDK discovers endpoints from both sources, generating a unified metadata archive with all commands, queries, and events.

**Why this priority**: Enables gradual migration strategies and supports hybrid architectures. Teams don't have to commit to one pattern exclusively.

**Independent Test**: Create a service with both Minimal API endpoints and Controller actions, run metadata generation, and verify both sets of endpoints appear in the archive.

**Acceptance Scenarios**:

1. **Given** a service with 2 Minimal API endpoints and 2 Controller actions, **When** metadata generation runs, **Then** all 4 endpoints appear in the contracts section
2. **Given** overlapping route patterns between Minimal API and Controller, **When** metadata generation runs, **Then** both endpoints are discovered without conflict
3. **Given** duplicate endpoint names across Minimal API and Controller, **When** metadata generation runs, **Then** the system reports a validation error

---

### User Story 3 - Schema Inference from Controllers (Priority: P2)

The SDK infers request/response schemas from controller action parameters and return types, matching the behavior of Minimal API schema inference (feature 023-endpoint-command-inference).

**Why this priority**: Maintains consistency with existing schema generation patterns. Without this, developers would need to manually specify schemas for controller endpoints.

**Independent Test**: Create a controller action with a `[FromBody]` request DTO and a response DTO return type, run metadata generation, and verify the generated schema file matches the DTO structure.

**Acceptance Scenarios**:

1. **Given** a controller action with `CreateOrderRequest` as `[FromBody]` parameter, **When** metadata generation runs, **Then** a schema file "schemas/endpoints/create-order-request.schema.json" is generated
2. **Given** a controller action returning `ActionResult<OrderResponse>`, **When** metadata generation runs, **Then** the schema unwraps the wrapper type and uses `OrderResponse`
3. **Given** a controller action with no `[FromBody]` parameter, **When** metadata generation runs, **Then** no request schema is generated
4. **Given** a controller action with explicit `Schema = "custom.schema.json"` in the attribute, **When** metadata generation runs, **Then** the custom schema path is used

---

### User Story 4 - Event Production from Controllers (Priority: P3)

Controller actions can declare produced events using the `Produces` property on `[SpasCommand]`, and the SDK includes these in the command contract's `produces` array, matching Minimal API behavior.

**Why this priority**: Completes the feature parity with Minimal APIs. This is optional metadata that enhances choreography but isn't required for basic operation.

**Independent Test**: Create a controller command with `Produces = new[] { typeof(OrderCreatedEvent) }`, run metadata generation, and verify the command contract includes the event reference.

**Acceptance Scenarios**:

1. **Given** a command with `Produces = new[] { typeof(OrderCreatedEvent) }`, **When** metadata generation runs, **Then** the command contract includes `{"type": "order-created", "version": "1.0"}`
2. **Given** a command producing multiple events, **When** metadata generation runs, **Then** all events appear in the `produces` array
3. **Given** a command with invalid event type (no `[SpasEvent]` attribute), **When** metadata generation runs, **Then** validation fails with clear error

---

### Edge Cases

- **Documentation consistency**: Code comments claiming controller support exist before implementation; must identify and update all occurrences
- **CLI template generation**: Existing `spas-service init` templates may show only Minimal API patterns; must include controller examples
- **Route template resolution**: Class-level `[Route]` + method-level routing attributes (`[HttpPost]`, `[HttpGet("{id}")]`) must combine correctly
- **Route constraints**: Optional parameters `{id?}`, constraints `{id:int}`, and catch-all `{*path}` should be preserved in the discovered path
- **Attribute routing variations**: `[Route("[action]")]`, `[Route("api/[controller]")]` tokens must be resolved
- **No route attribute**: Controller without explicit routing (convention-based only) should be skipped with a warning
- **Multiple HTTP method attributes**: Action with both `[HttpPost]` and `[HttpPut]` should generate separate endpoint entries or fail validation
- **Async actions**: Controller methods returning `Task<IActionResult>` should infer schemas from the inner result type
- **API controller conventions**: `[ApiController]` attribute enables automatic model binding; ensure `[FromBody]` inference works correctly

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: SDK MUST discover controller actions annotated with `[SpasCommand]` or `[SpasQuery]` during metadata generation
- **FR-002**: SDK MUST resolve full HTTP paths by combining class-level `[Route]` and method-level routing attributes
- **FR-003**: SDK MUST extract HTTP verb from method attributes (`[HttpPost]`, `[HttpGet]`, `[HttpPut]`, `[HttpDelete]`, `[HttpPatch]`)
- **FR-004**: SDK MUST preserve existing Minimal API discovery behavior without any changes
- **FR-005**: SDK MUST generate identical metadata structure for controller endpoints as for Minimal API endpoints
- **FR-006**: SDK MUST infer request schemas from `[FromBody]` parameters or first complex parameter on controller actions
- **FR-007**: SDK MUST infer response schemas from controller action return types, unwrapping `ActionResult<T>`, `Task<T>`, etc.
- **FR-008**: SDK MUST support the `Produces` property on `[SpasCommand]` for controller actions
- **FR-009**: SDK MUST validate that produced event types have `[SpasEvent]` attribute
- **FR-010**: SDK MUST fail fast with clear diagnostics when controller metadata is incomplete or ambiguous
- **FR-011**: All documentation MUST be updated to reflect controller support (code comments in `SpasContractAttributes.cs`, SDK README.md, agent prompts, etc.)
- **FR-012**: CLI tool (`spas-service init`) MUST generate agent prompts and templates that include controller examples alongside minimal API examples
- **FR-013**: SDK MUST use `IActionDescriptorCollectionProvider` service to discover controller actions
- **FR-014**: Discovery MUST work without starting Kestrel (offline metadata generation mode)
- **FR-015**: Generated project templates MUST NOT restrict developers to Minimal API only

### Key Entities *(include if feature involves data)*

- **ControllerActionDescriptor**: ASP.NET Core's representation of a controller action with route template, HTTP method, and metadata
- **SpasCommandAttribute / SpasQueryAttribute**: Already-defined attributes, now applicable to controller methods
- **ContractsBuilder**: Existing builder that collects endpoint contracts; extended to accept controller-sourced metadata
- **IActionDescriptorCollectionProvider**: ASP.NET Core service providing access to all registered controller actions

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can generate metadata from controller-based services in under 5 seconds (same as Minimal API)
- **SC-002**: All existing Minimal API tests continue to pass with 100% success rate
- **SC-003**: Controller-based metadata generation produces byte-identical `spas.json` structure to Minimal API (only paths/names differ)
- **SC-004**: Mixed services (Controllers + Minimal API) generate complete metadata without errors or omissions
- **SC-005**: Documentation and examples clearly show both Minimal API and Controller patterns
- **SC-006**: All misleading claims of controller support are removed or corrected (0 false claims remaining)
- **SC-007**: CLI-generated projects (`spas-service init`) include controller examples by default

## Assumptions

- ASP.NET Core MVC is already registered via `builder.Services.AddControllers()` or `AddMvc()`
- Controller actions use attribute routing (`[Route]`, `[HttpGet]`, etc.), not convention-based routing
- Developers understand that metadata generation runs in offline mode (`--generate-metadata` flag)
- Schema inference follows the same rules as feature 023 (first complex parameter, unwrap wrappers)

## Out of Scope

- Convention-based routing (e.g., default route template `{controller}/{action}/{id?}`)
- Runtime metadata endpoints (removed in feature 021-sdk-metadata-extraction)
- Generating metadata from Razor Pages or Blazor components
- Custom route constraints or complex routing scenarios beyond attribute routing
- Compile-time metadata generation (using source generators) - may be future enhancement

## Dependencies

- Requires feature 021 (SDK Metadata Archive Extraction) - offline generation infrastructure
- Requires feature 023 (Endpoint Command Inference) - schema inference patterns
- Builds on feature 001 (dotnet-spas-sdk) - core SDK infrastructure

## Constraints

- MUST NOT break existing Minimal API functionality
- MUST maintain offline metadata generation approach (no runtime endpoints)
- MUST follow SDK boundaries (no CloudEvents wrapping, no sidecar concerns)
- MUST preserve kebab-case normalization for endpoint names
- MUST generate JSON Schema draft-07 compliant schemas (ADR-039)
- MUST work with .NET 10 target (net10.0)

## Notes

- Java SDK already supports controllers via annotation processor (compile-time) and runtime scanning
- Documentation currently has misleading comments claiming controller support exists **in multiple locations**:
  - `SpasContractAttributes.cs` lines 21, 70: "Apply to minimal API endpoints or controller actions"
  - SDK `README.md` line 84: States "Minimal APIs only"
  - CLI templates in `spas-service init`: May restrict to Minimal API patterns only
  - Agent prompts (`.github/agents/`, template files): May not mention controller option
- This feature requires accessing `IActionDescriptorCollectionProvider` from the DI container
- Testing strategy: reuse existing SampleService example, add controller variants alongside Minimal API endpoints
- **Documentation audit required**: Search codebase for "minimal API only" or similar restrictions before implementation
