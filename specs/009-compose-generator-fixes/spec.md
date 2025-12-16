# Feature Specification: spas-compose CLI Generator Fixes

**Feature Branch**: `009-compose-generator-fixes`  
**Created**: 2025-01-20  
**Completed**: 2025-12-16  
**Status**: ✅ Complete  
**Input**: Fix spas-compose CLI generator bugs discovered during Phase 2 E-Commerce choreography validation (FG01, FG05, FG06, FG07)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Runnable Docker Compose from Choreography (Priority: P1)

As a domain composer, I want to run `spas-compose choreography build --docker` and receive a docker-compose.yaml that starts all services and sidecars correctly without manual edits, so that I can validate choreographies immediately after generation.

**Why this priority**: This is the core value proposition of spas-compose. If generated files don't work, the tool provides no value and forces manual debugging.

**Independent Test**: Run `spas-compose choreography build --docker` on the E-Commerce example, then `docker compose up` - all services should start and communicate successfully.

**Acceptance Scenarios**:

1. **Given** a valid choreography.yaml with services that have runtime metadata, **When** I run `spas-compose choreography build --docker`, **Then** the generated docker-compose.yaml uses `image:` references from service runtime metadata (not `build:` directives).

2. **Given** a choreography with event flows between services, **When** I run `spas-compose choreography build --docker`, **Then** the generated sidecar configs contain correct `eventType` matching the full CloudEvents type from service metadata (e.g., `com.ecommerce.order.created`).

3. **Given** generated docker-compose and configs, **When** I run `docker compose up`, **Then** services start on port 8080, sidecars start on port 7001, and event flows work end-to-end.

---

### User Story 2 - Sidecar Event Routing Works Out of Box (Priority: P1)

As a domain composer, I want sidecar configs to correctly route events between services without manual fixes, so that services can publish and receive events immediately after docker compose starts.

**Why this priority**: Event routing is the core choreography feature. Broken routing means the entire domain composition fails.

**Independent Test**: After generation, publish an event from one service and verify the target service receives it through the sidecar.

**Acceptance Scenarios**:

1. **Given** a service that publishes `OrderCreated` events, **When** I generate sidecar config, **Then** the outbound config includes `eventType: "com.ecommerce.order.created"` (full CloudEvents type from service metadata).

2. **Given** a service with an incoming events endpoint, **When** I generate sidecar config, **Then** the `invokeEndpoint` is derived from service contract metadata (e.g., `/incoming`).

3. **Given** a choreography with transformations, **When** I generate sidecar config, **Then** the `transform` path includes the service folder (e.g., `transformations/inventory-service/inbound-order-created.jsonata`).

---

### User Story 3 - Initialize Domain with Custom Output Path (Priority: P2)

As a domain composer, I want to specify where domain files are created using `--output`, while agent prompts go to the project root, so that I can organize multiple domains in a monorepo structure.

**Why this priority**: Supports organizational patterns but isn't blocking basic functionality.

**Independent Test**: Run `spas-compose init public --output ./examples/ecommerce/public` and verify files are created in correct locations with correct path references.

**Acceptance Scenarios**:

1. **Given** I run `spas-compose init public --output ./examples/ecommerce/public`, **Then** choreography files are created in `./examples/ecommerce/public/` and agent prompts are created in `./.github/agents/` at project root.

2. **Given** agent prompts are generated with `--output`, **Then** all path references in the prompt point to the correct domain location (e.g., `./examples/ecommerce/public/services/*/spas.json`).

3. **Given** agent prompts are generated for an external project, **Then** the prompt does not reference SPAS principles (which won't exist in the target project).

---

### Edge Cases

- What happens when a service has no runtime metadata? Generator should warn and skip image generation for that service.
- What happens when a service metadata has no events defined? Generator should produce empty inbound/outbound arrays.
- What happens when `--output` path doesn't exist? Generator should create the directory structure.
- What happens when a service contract doesn't specify an incoming endpoint? Generator should use a sensible default (e.g., `/incoming`) and log a warning.

## Requirements *(mandatory)*

### Functional Requirements

#### Docker Compose Generation (FG05)

- **FR-001**: Generator MUST use `image:` directive from service runtime metadata instead of `build:` when runtime metadata is present
- **FR-002**: Generator MUST reference the published sidecar image (`spas/sidecar:latest`) instead of expecting local `./spas-sidecar/` folder

#### Sidecar Config Generation - Event Types (FG06.1, FG06.2)

- **FR-003**: Generator MUST include `eventType` field in all outbound config entries
- **FR-004**: Generator MUST use the full CloudEvents type from service metadata (e.g., `com.ecommerce.order.created`) as the `eventType` value, not the short event name (e.g., `OrderCreated`)

#### Sidecar Config Generation - Endpoints (FG06.3)

- **FR-005**: Generator MUST derive `invokeEndpoint` from service contract metadata when available
- **FR-006**: Generator MUST use `/incoming` as the default `invokeEndpoint` when service contract does not specify an endpoint

#### Sidecar Config Generation - Transform Paths (FG06.4)

- **FR-007**: Generator MUST include the service folder name in transform paths (e.g., `transformations/inventory-service/inbound-order-created.jsonata`)

#### Port Configuration (FG07)

- **FR-008**: Generator MUST use port 8080 as the internal port for all .NET service containers
- **FR-009**: Generator MUST use port 7001 as the standard sidecar port for all sidecars
- **FR-010**: Generator MUST use `SIDECAR_PORT` environment variable for sidecars (not `PORT`)
- **FR-011**: Generator MUST add `SERVICE_NAME` environment variable to all service containers
- **FR-012**: Generator MUST add `SIDECAR_PORT` environment variable to all service containers

#### Init Command Extension (FG01)

- **FR-013**: `spas-compose init` MUST accept an `--output` argument specifying where to create domain files
- **FR-014**: Generator MUST create agent prompts at project root `./.github/agents/` regardless of `--output` value
- **FR-015**: Generator MUST update all path references in agent prompts to reflect the actual domain location
- **FR-016**: Generator MUST NOT include references to SPAS principles in agent prompts (since these won't exist in external projects)
- **FR-017**: Agent prompt file MUST use `/spas.compose` naming convention instead of `/spas-compose`

### Key Entities

- **choreography.yaml**: Domain choreography definition with event flows between services
- **docker-compose.yaml**: Generated container orchestration file with services and sidecars
- **config.{service-name}.json**: Generated sidecar configuration file per service
- **Service Metadata (spas.json)**: Contains runtime, contract, and event information for each service
- **Agent Prompt**: Generated markdown file with AI agent instructions for domain composition

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Running `spas-compose choreography build --docker` on the E-Commerce example produces a docker-compose.yaml that starts all services successfully with `docker compose up`
- **SC-002**: All generated sidecar configs pass schema validation against `sidecar-config-v1.schema.json`
- **SC-003**: Event flows work end-to-end without manual config edits (OrderCreated → StockReserved round-trip completes)
- **SC-004**: Services can publish events to their sidecar immediately after docker compose starts (no connection failures)
- **SC-005**: Running `spas-compose init public --output ./custom/path` creates files in correct locations with valid path references

## Assumptions

- .NET services in containers use port 8080 by default (ASP.NET Core behavior)
- The sidecar naming convention is `{service-name}-sidecar`
- The SDK reads `SERVICE_NAME` and `SIDECAR_PORT` environment variables
- All services use `/incoming` as the default incoming events endpoint unless specified otherwise
- Transform files are organized in `transformations/{service-name}/` folders

## Dependencies

- Service metadata must include `runtime` section with `image`, `repository`, and `tag` fields
- Service metadata must include `contract.events` section with full CloudEvents types
- sidecar-config-v1.schema.json must be updated if any config structure changes are needed

## Out of Scope

- **FG06.5**: Sidecar transform file loading bug (sidecar code change, separate spec)
- **FG08**: SDK sidecar host derivation from SERVICE_NAME (SDK code change, separate spec)
- Port configuration via service metadata schema (future enhancement)
- Port override in choreography.yaml per service (future enhancement)

## References

- [README.md Feature Grooming](../../README.md) - FG01, FG05, FG06, FG07 detailed descriptions
- [examples/domains/ecommerce/public/](../../examples/domains/ecommerce/public/) - Manually fixed reference implementation
- [components/cli/spas-compose/](../../components/cli/spas-compose/) - CLI implementation to modify

