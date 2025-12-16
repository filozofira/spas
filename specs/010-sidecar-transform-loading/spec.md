# Feature Specification: Sidecar Transform File Loading

**Feature Branch**: `010-sidecar-transform-loading`  
**Created**: 2025-12-16  
**Completed**: 2025-12-16  
**Status**: ✅ Complete (PoC)  
**Input**: User description: "Fix sidecar transform file loading (FG06.5). The sidecar currently passes the transform file path directly to JSONata instead of loading the file content first. This causes transform failures when using file-based transforms."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Apply File-Based Transform to Inbound Events (Priority: P1)

As a domain composer, I need the sidecar to apply JSONata transformations from external files so that I can transform event payloads before they reach my service without embedding expressions in configuration.

**Why this priority**: This is the core functionality that's broken. Without file-based transforms, the entire choreography-based event transformation workflow fails. Events cannot be adapted to service expectations.

**Independent Test**: Can be fully tested by configuring a sidecar with a transform file path, publishing an event, and verifying the transformed payload reaches the service endpoint.

**Acceptance Scenarios**:

1. **Given** a sidecar config with `"transform": "transformations/inbound-order-created.jsonata"`, **When** an event is received on the subscribed topic, **Then** the sidecar loads the file content and applies the JSONata expression to the event payload.

2. **Given** a transform file containing `{ "orderId": data.id, "items": data.lineItems }`, **When** an event with `{ "id": "123", "lineItems": [...] }` is received, **Then** the service receives `{ "orderId": "123", "items": [...] }`.

3. **Given** a sidecar config with `"transform": "$.data"` (inline expression), **When** an event is received, **Then** the expression is evaluated directly without file loading (backward compatible).

---

### User Story 2 - Cache Compiled Transform Expressions (Priority: P2)

As a sidecar operator, I need transform expressions to be cached after first compilation so that repeated event processing doesn't incur file I/O or compilation overhead.

**Why this priority**: Performance is critical for event processing. Re-reading and recompiling transforms for every event would create unacceptable latency.

**Independent Test**: Can be tested by measuring processing time of first vs. subsequent events with the same transform, verifying second event processes significantly faster.

**Acceptance Scenarios**:

1. **Given** a file-based transform has been loaded and compiled, **When** subsequent events require the same transform, **Then** the cached compiled expression is used.

2. **Given** the transform cache contains compiled expressions, **When** the sidecar processes 1000 events with the same transform, **Then** the file is read only once.

---

### User Story 3 - Apply File-Based Transform to Outbound Events (Priority: P3)

As a domain composer, I need outbound transforms from files to work so that I can transform service responses before they're published as events.

**Why this priority**: Outbound transforms follow the same pattern as inbound. Once inbound works, outbound should use the same mechanism.

**Independent Test**: Can be tested by configuring an outbound transform file path, invoking the publish endpoint, and verifying the transformed event is published.

**Acceptance Scenarios**:

1. **Given** an outbound config with `"transform": "transformations/outbound-order-created.jsonata"`, **When** the service publishes to the sidecar, **Then** the sidecar loads the file and applies the transform before publishing.

---

### Edge Cases

- What happens when the transform file doesn't exist? The sidecar rejects the event with an error response identifying the missing file.
- What happens when the transform file contains invalid JSONata syntax? The sidecar rejects the event with an error response identifying the file and parse error.
- What happens when the transform file path is absolute vs. relative? Relative paths should resolve from the sidecar's working directory (typically where config.json is mounted).
- How does the system distinguish file paths from inline expressions? File paths end with `.jsonata` extension; other strings are treated as inline expressions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sidecar MUST load transform file content when the transform value ends with `.jsonata` extension
- **FR-002**: Sidecar MUST treat transform values not ending in `.jsonata` as inline JSONata expressions (backward compatible)
- **FR-003**: Sidecar MUST cache compiled JSONata expressions keyed by file path or expression string
- **FR-004**: Sidecar MUST resolve relative file paths from its working directory
- **FR-005**: Sidecar MUST log a clear error message when a transform file cannot be read or parsed
- **FR-006**: Sidecar MUST apply file-based transforms for both inbound (event→service) and outbound (service→event) flows
- **FR-007**: Sidecar MUST validate transform file syntax when first loaded and surface errors clearly
- **FR-008**: Sidecar MUST reject events with an error response when transform file loading or parsing fails (fail explicitly, no silent pass-through)

### Key Entities

- **Transform Expression**: A JSONata expression (string) that transforms event payloads. Can be inline or loaded from a file.
- **Transform Cache**: In-memory storage of compiled JSONata expressions, keyed by source (file path or inline expression string).
- **Inbound Entry**: Configuration for consuming events, includes optional `transform` field.
- **Outbound Entry**: Configuration for publishing events, includes optional `transform` field.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Events with file-based transforms are successfully processed and delivered to service endpoints with correct transformations applied
- **SC-002**: Transform files are read only once per unique path, with subsequent uses hitting the cache
- **SC-003**: Invalid transform files produce clear error messages that identify the file and the parse error
- **SC-004**: Existing inline transform configurations continue to work without modification (100% backward compatible)
- **SC-005**: E-Commerce example choreography with file-based transforms runs successfully end-to-end

## Assumptions

- Transform files use UTF-8 encoding
- Transform file paths in configuration are relative to the sidecar's working directory (typically `/app` in container)
- The `.jsonata` extension is the standard indicator for file-based transforms
- Sidecar has read access to the directory where transform files are mounted

## Clarifications

### Session 2025-12-16

- Q: What should happen when a transform file cannot be loaded or contains invalid JSONata syntax during event processing? → A: Reject the event and return an error response (fail explicitly)
