# Feature Specification: CloudEvents Type Construction Refactor

**Feature Branch**: `012-cloudevents-type-refactor`  
**Created**: 2025-01-20  
**Status**: Draft  
**Input**: FG09 - Move CloudEvents `type` field construction from SDK to Sidecar for cleaner separation of concerns

## Problem Statement

Currently, both the SDK and sidecar have knowledge of the CloudEvents `type` format (`com.{boundedContext}.{event-name-kebab}`). The SDK constructs the full type string and passes it via `x-event-type` header, while the sidecar just copies it into the CloudEvents envelope. This violates DRY and creates maintenance burden when the format needs to change.

**Current flow:**
1. SDK constructs full type: `com.order-service.order-created`
2. SDK sends header: `x-event-type: com.order-service.order-created`
3. Sidecar copies header value → CloudEvents `type` field

**Target flow:**
1. SDK sends short event name: `x-event-name: order-created`
2. SDK sends service name: `x-service-name: order-service` (already exists)
3. Sidecar constructs full type: `com.order-service.order-created`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - SDK Sends Short Event Name (Priority: P1)

As a service developer using the .NET SDK, I want the SDK to send only the short event name header so that the sidecar can construct the full CloudEvents type, reducing SDK complexity and centralizing type format logic.

**Why this priority**: This is the core change that enables the architectural improvement. Without SDK changes, the sidecar cannot take over type construction.

**Independent Test**: Can be fully tested by publishing an event via SDK and verifying the outgoing HTTP request contains `x-event-name` header with short kebab-case name instead of full `x-event-type`.

**Acceptance Scenarios**:

1. **Given** an SDK EventPublisher configured with service name "order-service", **When** I publish an event with type "OrderCreated", **Then** the HTTP request to sidecar contains header `x-event-name: order-created` (kebab-case).
2. **Given** an SDK EventPublisher, **When** I publish an event using `PublishAsync<TEvent>(payload)`, **Then** the HTTP request contains `x-event-name` derived from the SpasEventAttribute.Name converted to kebab-case.
3. **Given** an SDK EventPublisher, **When** I publish an event, **Then** the HTTP request does NOT contain `x-event-type` header (replaced by `x-event-name`).

---

### User Story 2 - Sidecar Constructs Full Type (Priority: P1)

As the sidecar component, I need to construct the full CloudEvents `type` from the `x-service-name` and `x-event-name` headers so that the CloudEvents envelope contains the properly formatted type field.

**Why this priority**: Equal priority with US1 - both changes are required for the system to function correctly after refactor.

**Independent Test**: Can be tested by sending HTTP POST to sidecar `/publish` endpoint with `x-service-name` and `x-event-name` headers and verifying the published CloudEvent has correct `type` field.

**Acceptance Scenarios**:

1. **Given** sidecar receives publish request with headers `x-service-name: order-service` and `x-event-name: order-created`, **When** sidecar constructs CloudEvent, **Then** the `type` field is `com.order-service.order-created`.
2. **Given** sidecar receives publish request with `x-event-type` header (legacy), **When** sidecar constructs CloudEvent, **Then** sidecar uses `x-event-type` value directly (backward compatibility).
3. **Given** sidecar receives publish request missing both `x-event-type` and `x-event-name`, **When** sidecar validates request, **Then** sidecar returns 400 error with clear message about missing headers.

---

### User Story 3 - CLI Generates Short Event Name (Priority: P2)

As a platform engineer using spas-compose, I want the sidecar config generator to produce configs with short event names so that generated configs align with the new header convention.

**Why this priority**: CLI changes are required for new deployments but existing configs continue to work with backward compatibility.

**Independent Test**: Can be tested by running `spas-compose choreography build --docker` and verifying generated sidecar configs use `eventName` instead of full `eventType` in outbound entries.

**Acceptance Scenarios**:

1. **Given** a choreography with service that publishes "OrderCreated" events, **When** I generate sidecar config, **Then** outbound entry contains `eventName: "order-created"` (short kebab-case).
2. **Given** a service metadata with bounded context "order" and event "OrderCreated", **When** sidecar config is generated, **Then** the routing lookup key is derived from the short event name.

---

### User Story 4 - Documentation Update (Priority: P3)

As a framework maintainer, I want the principles documentation to reflect the new header convention so that developers understand the correct integration pattern.

**Why this priority**: Documentation is important but can follow implementation.

**Independent Test**: Can be verified by reviewing updated docs for accuracy and consistency.

**Acceptance Scenarios**:

1. **Given** principles doc 10-sidecar-contract.md, **When** I read the publish endpoint section, **Then** it documents `x-event-name` as the required header.
2. **Given** principles doc 12-sdk.md, **When** I read the event publishing section, **Then** it describes SDK sending short event name, not full type.

---

### Edge Cases

- What happens when sidecar receives both `x-event-type` (legacy) and `x-event-name` (new)? **Answer**: Prefer `x-event-name` + construct type; ignore `x-event-type`.
- What happens when service name contains special characters? **Answer**: Use as-is; service name already normalized at registration time.
- What happens when event name is already kebab-case? **Answer**: Pass through unchanged.
- What happens during rolling deployment (old SDK + new sidecar)? **Answer**: Sidecar backward compatible - accepts `x-event-type` if `x-event-name` missing.

## Requirements *(mandatory)*

### Functional Requirements

**SDK Changes:**
- **FR-001**: SDK MUST send `x-event-name` header containing kebab-case event name (e.g., "order-created")
- **FR-002**: SDK MUST remove `x-event-type` header from publish requests
- **FR-003**: SDK MUST convert PascalCase event names to kebab-case before sending

**Sidecar Changes:**
- **FR-004**: Sidecar MUST construct CloudEvents `type` as `com.{x-service-name}.{x-event-name}` when `x-event-name` header present
- **FR-005**: Sidecar MUST accept legacy `x-event-type` header for backward compatibility when `x-event-name` is absent
- **FR-006**: Sidecar MUST prefer `x-event-name` over `x-event-type` when both present
- **FR-007**: Sidecar MUST return 400 error if neither `x-event-type` nor `x-event-name` header is present

**CLI Changes:**
- **FR-008**: CLI sidecar-config-generator MUST generate `eventName` field in outbound entries (short name)
- **FR-009**: CLI MUST retain `eventType` field for routing lookup (sidecar uses for topic mapping)

**Documentation:**
- **FR-010**: Principles doc 10-sidecar-contract.md MUST document `x-event-name` header convention
- **FR-011**: Principles doc 12-sdk.md MUST document SDK sending short event name

### Key Entities

- **Publish Headers**: The set of HTTP headers sent from SDK to sidecar: `x-service-name`, `x-event-name` (new), `x-correlation-id`, `traceparent`
- **CloudEvents Type**: The `type` field in CloudEvents envelope, format: `com.{service-name}.{event-name-kebab}`
- **Outbound Entry**: Sidecar config mapping event name to topic

## Assumptions

- Service names are already normalized/validated at registration time
- Event names in SpasEventAttribute are PascalCase by convention
- The `com.` prefix is the standard CloudEvents type prefix for this system
- Existing deployments using old SDK/sidecar combinations will continue working due to backward compatibility

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of SDK publish requests use `x-event-name` header instead of `x-event-type`
- **SC-002**: Sidecar correctly constructs full CloudEvents type from headers for all published events
- **SC-003**: Backward compatibility: Old SDKs using `x-event-type` continue to work with new sidecar
- **SC-004**: All existing tests pass after refactor (SDK, sidecar, CLI)
- **SC-005**: Documentation accurately reflects new header convention
