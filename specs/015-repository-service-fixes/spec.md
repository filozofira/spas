# Feature Specification: Repository Service Enhancements

**Feature Branch**: `015-repository-service-fixes`  
**Created**: December 19, 2025  
**Status**: Draft  
**Input**: User description: "Extend spas repository with an endpoint to list all services without a filter. Also fix one bug where Pulled service spas.json has "schemaVersion": "design-time-metadata-v1" while it should be runtime spas.json schema."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Service Discovery Without Filters (Priority: P1)

Service operators and developers need to discover all available services in the SPAS ecosystem without having to know specific capabilities or bounded contexts beforehand. This provides a complete inventory view for system understanding, monitoring dashboards, and administrative tasks.

**Why this priority**: Core functionality that enables service discovery workflows and system visibility. Essential for operators who need to see the complete service landscape without prior knowledge of filtering criteria.

**Independent Test**: Can be fully tested by calling `GET /services` without query parameters and verifies that all published services are returned with proper metadata, delivering immediate value for service inventory purposes.

**Acceptance Scenarios**:

1. **Given** multiple services are published in the repository, **When** I call `GET /services` without any query parameters, **Then** I receive a list of all published services with their basic metadata
2. **Given** no services exist in the repository, **When** I call `GET /services` without query parameters, **Then** I receive an empty results list with proper structure
3. **Given** services exist across multiple bounded contexts, **When** I call `GET /services` without filters, **Then** all services from all bounded contexts are included in results

---

### User Story 2 - Correct Schema Version for Retrieved Services (Priority: P2)

When services are retrieved from the repository, developers and tools expect the schema version to accurately reflect that this is runtime metadata enriched with deployment information, not the original design-time metadata.

**Why this priority**: Data integrity issue that ensures correct metadata typing for downstream tools and prevents confusion about metadata content. Critical for proper tool integration and API contract clarity.

**Independent Test**: Can be tested by retrieving any published service and verifying the `schemaVersion` field shows `"runtime-metadata-v1"` instead of `"design-time-metadata-v1"`, ensuring proper metadata classification.

**Acceptance Scenarios**:

1. **Given** a service is published to the repository, **When** I retrieve the service via `GET /services/{serviceName}`, **Then** the returned metadata has `schemaVersion` set to `"runtime-metadata-v1"`
2. **Given** a service is retrieved through search endpoints, **When** the service data is returned, **Then** the schema version reflects runtime metadata format
3. **Given** services are listed via the new list-all endpoint, **When** services are returned, **Then** each service has the correct runtime schema version

---

### Edge Cases

- What happens when the repository contains thousands of services and all are requested without pagination?
- How does the system handle concurrent requests to list all services during high-traffic periods?
- What happens when a service's schema version is already corrupted in storage?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a `GET /services` endpoint that returns all services when no query parameters are provided
- **FR-002**: System MUST return all published services in the unfiltered list endpoint with consistent pagination structure
- **FR-003**: System MUST set `schemaVersion` to `"runtime-metadata-v1"` for all service metadata returned from repository endpoints
- **FR-004**: System MUST ensure retrieved services contain runtime deployment information when available
- **FR-005**: System MUST maintain backward compatibility with existing filtered search endpoints (`capability` and `boundedContext` parameters)
- **FR-006**: System MUST return services in a consistent format across all endpoints (filtered and unfiltered)
- **FR-007**: System MUST handle empty repository state gracefully for the unfiltered list endpoint

### Key Entities

- **ServiceMetadata**: Represents complete service information with runtime fields, schema version indicates whether this is design-time or runtime-enriched metadata
- **SearchResults**: Paginated response structure containing total count, pagination details, and service results array
- **ServiceInfo**: Lightweight service representation used in list responses, includes basic metadata and runtime information when available

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can retrieve complete service inventory in under 2 seconds for repositories with up to 100 services
- **SC-002**: All retrieved service metadata correctly identifies as runtime schema version, eliminating metadata type confusion
- **SC-003**: System maintains 100% backward compatibility with existing search endpoints during and after enhancement
- **SC-004**: Service discovery workflows complete successfully without requiring prior knowledge of filtering criteria

## Assumptions *(optional)*

- The current storage provider can efficiently handle unfiltered queries without performance degradation
- The existing pagination structure in SearchResults is suitable for large service lists
- Service metadata transformation from design-time to runtime schema is a repository responsibility
- The schemaVersion bug affects retrieved metadata but not stored metadata integrity
