# Feature Specification: SPAS Repository Service

**Feature Branch**: `003-repository-service`  
**Created**: December 13, 2025  
**Status**: Draft  
**Input**: User description: "Build SPAS Repository while following all principles defined in principles\component\11-repository.md as well as any other decision you may find in docs."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Publish Service Metadata (Priority: P1)

A service developer packages their service with `spas.json` and schemas, then publishes it to the repository via `POST /services/{serviceName}:{version}` using a multipart/form-data archive (ZIP) so the service can be discovered and deployed by platform operators.

**Why this priority**: This is the foundational capability - without the ability to publish service metadata, the repository has no content and provides no value. This represents the minimal viable repository functionality.

**Independent Test**: Can be fully tested by publishing a sample service with valid `spas.json` and schemas via POST endpoint, then verifying the service appears in the repository storage. Delivers immediate value by enabling service registration.

**Acceptance Scenarios**:

1. **Given** a service package with valid `spas.json` and schemas, **When** developer publishes via `POST /services/{serviceName}:{version}` (multipart with `archive`), **Then** service metadata is stored with serviceName and version as the unique key
2. **Given** a service package with invalid `spas.json` schema, **When** developer attempts to publish, **Then** publish is rejected with validation error details
3. **Given** a service already published with name "order-service" version "1.0.0", **When** developer attempts to publish the same name and version combination, **Then** publish is rejected with duplicate detection error
4. **Given** a service package with schemas, **When** service is published, **Then** all schemas are stored and associated with the service version
5. **Given** a service package with image digest reference, **When** service is published, **Then** image digest is stored in metadata for integrity verification
6. **Given** an archive (ZIP) containing `spas.json` and associated schema files, **When** developer publishes via `POST /services/{serviceName}:{version}` with multipart `archive`, **Then** the archive is validated, unpacked, and both metadata and schemas are stored together
7. **Given** an archive missing `spas.json` or containing invalid schema files, **When** developer publishes via multipart `archive`, **Then** publish is rejected with specific error messages indicating missing/invalid artifacts
8. **Given** an archive where `spas.json` declares a different serviceName or version than the path, **When** developer publishes via `POST /services/{serviceName}:{version}`, **Then** publish is rejected with a 409 Conflict indicating identity mismatch

---

### User Story 2 - Retrieve Service Information (Priority: P1)

A platform operator or CLI tool queries the repository to retrieve service metadata, versions, and schemas needed for deployment or discovery.

**Why this priority**: Retrieval is equally critical as publishing - the repository must serve published metadata to be useful. Together with publishing, this creates the minimal viable repository service.

**Independent Test**: Can be fully tested by retrieving a previously published service via GET endpoints, verifying correct metadata and schemas are returned. Delivers value by enabling service discovery and deployment workflows.

**Acceptance Scenarios**:

1. **Given** a published service "order-service", **When** user requests `GET /services/order-service`, **Then** service details are returned with current metadata
2. **Given** a service with multiple versions (1.0.0, 1.1.0, 2.0.0), **When** user requests `GET /services/order-service/versions`, **Then** all versions are listed in descending order
3. **Given** a published service version, **When** user requests `GET /services/{serviceName}/versions/{version}`, **Then** merged `spas.json` with schema references is returned
4. **Given** a service version with schemas, **When** user requests `GET /services/{serviceName}/versions/{version}/schemas`, **Then** list of all schemas is returned
5. **Given** a specific schema for a service version, **When** user requests `GET /services/{serviceName}/versions/{version}/schemas/{schemaName}`, **Then** schema content is returned
6. **Given** a published service, **When** user requests `GET /services/{serviceName}/versions/{version}/download`, **Then** a complete archive containing `spas.json` and all schemas is returned

---

### User Story 3 - Search Services by Capability (Priority: P2)

A platform operator searches for services that provide specific capabilities (e.g., "payment-processing") to understand what services can fulfill a particular need in their domain composition.

**Why this priority**: Search enables service discovery at scale. While not required for basic publish/retrieve workflows, it significantly improves developer experience for larger service catalogs.

**Independent Test**: Can be fully tested by publishing services with different capabilities, then querying by capability and verifying correct services are returned. Delivers value by enabling capability-based service discovery.

**Acceptance Scenarios**:

1. **Given** multiple services published with various capabilities, **When** user queries `GET /services?capability=payment-processing`, **Then** only services declaring that capability are returned
2. **Given** a service declaring multiple capabilities, **When** user searches by any of those capabilities, **Then** the service appears in results
3. **Given** no services match the requested capability, **When** user searches, **Then** an empty result set is returned

---

### User Story 4 - Search Services by Bounded Context (Priority: P2)

A platform operator searches for services belonging to a specific bounded context (e.g., "order-management") to understand which services operate within a particular bounded context for domain composition and service discovery.

**Why this priority**: Bounded context search is essential for domain-driven design and service organization. It enables operators to discover services by their domain boundaries, which is critical for understanding service responsibilities and dependencies.

**Independent Test**: Can be fully tested by publishing services with different bounded contexts, then searching by bounded context. Delivers value for domain-driven architecture practices and proper service organization.

**Acceptance Scenarios**:

1. **Given** services published with different `boundedContext` values, **When** user queries `GET /services?boundedContext=order-management`, **Then** only services in that bounded context are returned
2. **Given** a service declaring boundedContext "payment", **When** user searches for "payment", **Then** the service appears in results
3. **Given** no services match the requested bounded context, **When** user searches, **Then** an empty result set is returned

---

### User Story 5 - Unpublish Service Version (Priority: P3)

A service maintainer needs to remove a published service version due to critical defects or security issues.

**Why this priority**: Unpublishing is important for operational safety but less critical than core publish/retrieve flows. It's needed for production environments but can be deferred in initial PoC.

**Independent Test**: Can be fully tested by unpublishing a service version and verifying it no longer appears in searches or retrieval endpoints. Delivers value by enabling error correction and security response.

**Acceptance Scenarios**:

1. **Given** a published service version, **When** maintainer executes `DELETE /services/{serviceName}/versions/{version}`, **Then** that specific version is removed from the repository
2. **Given** a service with multiple versions where one is deleted, **When** user lists versions, **Then** the deleted version does not appear but other versions remain
3. **Given** an unpublished version, **When** user attempts to retrieve it, **Then** a not found error is returned

---

### Edge Cases

- What happens when a service is published with a valid schema format but the schema content doesn't match the events declared in `spas.json`?
- How does the system handle concurrent publishes of the same serviceName+version combination?
- What happens when archive integrity check fails during publish (mismatched checksums)?
- How does the system handle retrieval requests for versions that were partially published but failed during the publish transaction?
- What happens when image digest validation is enabled but the referenced image doesn't exist in the external registry?
- How does the system handle schema evolution violations (non-additive changes) when a new version is published?
- What happens when storage reaches capacity during a publish operation?
- How are orphaned schemas (schemas stored but not referenced by any current service version) handled?

## Requirements _(mandatory)_

### Functional Requirements

#### Publishing

- **FR-001**: System MUST accept service metadata via `POST /services/{serviceName}:{version}` endpoint (path is the source of truth for identity)
- **FR-001a**: System MUST support publishing via multipart/form-data with part `archive` (ZIP) containing `spas.json` and associated schema files; on success, metadata and all schemas are stored as if provided individually
- **FR-002**: System MUST validate `spas.json` against the SPAS schema specification before accepting publication
- **FR-003**: System MUST enforce uniqueness of serviceName+version combination and reject duplicate publications
- **FR-004**: System MUST store service metadata with indexing by serviceName, version, capabilities, and boundedContext
- **FR-005**: System MUST store image digest from metadata for integrity verification
- **FR-007**: System MUST accept and store schemas associated with service version at publish time
- **FR-008**: System MUST perform archive integrity validation during publish using checksums (SHA-256 required for production, optional for PoC)
- **FR-008a**: In PoC, checksum MAY be provided as a separate multipart/form-data part named `checksum` (SHA-256 of the `archive` ZIP); if present, it MUST be verified; in production, checksum verification is REQUIRED
- **FR-009**: System MUST validate schema evolution rules for services with existing versions (additive-only changes)
- **FR-010**: System MUST provide detailed validation error messages when publish is rejected

#### Retrieval

- **FR-011**: System MUST provide `GET /services/{serviceName}` endpoint to retrieve current service details
- **FR-012**: System MUST provide `GET /services/{serviceName}/versions` endpoint to list all versions in descending order
- **FR-013**: System MUST provide `GET /services/{serviceName}/versions/{version}` endpoint to retrieve merged `spas.json` with schema references
- **FR-014**: System MUST provide `GET /services/{serviceName}/versions/{version}/download` endpoint to download complete service archive (spas.json + all schemas)
- **FR-015**: System MUST provide `GET /services/{serviceName}/versions/{version}/schemas` endpoint to list all schemas for a version
- **FR-016**: System MUST provide `GET /services/{serviceName}/versions/{version}/schemas/{schemaName}` endpoint to retrieve specific schema content

#### Search & Discovery

- **FR-017**: System MUST provide `GET /services?capability={cap}` endpoint to search services by capability
- **FR-018**: System MUST provide `GET /services?boundedContext={context}` endpoint to search services by bounded context
- **FR-019**: System MUST return empty result sets when search queries match no services

#### Unpublishing

- **FR-020**: System MUST provide `DELETE /services/{serviceName}/versions/{version}` endpoint to unpublish specific service versions
- **FR-021**: System MUST remove all associated metadata and schemas when a version is unpublished
- **FR-022**: System MUST preserve other versions when one version of a service is unpublished

#### Storage & Persistence

- **FR-023**: System MUST use file-based storage for service metadata and schemas on local volume for PoC (enables offline operation)
- **FR-024**: System MUST organize storage to support efficient retrieval by serviceName, version, capability, and boundedContext
- **FR-025**: System MUST store OCI image references (registry URL and digest) but NOT store the actual container images
- **FR-026**: System MUST maintain transactional integrity for publish operations (all-or-nothing commits)

#### Schema Registry Integration

- **FR-027**: System MUST integrate schema storage as part of repository service in PoC
- **FR-028**: System MUST enforce additive-only schema evolution rules (new fields must be optional)
- **FR-029**: System MUST log warnings for schema compatibility issues in PoC (errors block publish in production)
- **FR-030**: System MUST support pluggable schema registry backends for future production deployments

#### Validation & Integrity

- **FR-031**: System MUST validate `spas.json` structure against the current SPAS schema version
- **FR-032**: System MUST validate semantic versioning format for service versions (MAJOR.MINOR.PATCH)
- **FR-033**: System MUST verify required fields in `spas.json`: serviceName, version, boundedContext, capabilities
- **FR-034**: System MUST validate that version numbers follow semantic versioning rules and evolution (new versions should be higher)
- **FR-034a**: System MUST reject publish when `{serviceName}:{version}` in the URL does not match the values in `spas.json` (conflict 409)

#### Authorization & Policy (PoC vs Production)

- **FR-035**: System MAY skip authentication and authorization in PoC for local development speed
- **FR-036**: System MUST document production requirements for OIDC/RBAC authentication
- **FR-037**: System MUST document production requirements for package signing verification
- **FR-038**: System MUST document production requirements for policy enforcement at publish time

### Key Entities

- **Service Metadata**: Represents a published service with unique serviceName+version. Contains attributes: serviceName (string, required), version (semver string, required), boundedContext (string, required), capabilities (array of strings, required), imageDigest (string, optional), schemas (array of schema references), publishDate (timestamp), and custom metadata fields from `spas.json`.

- **Service Version**: Represents a specific versioned release of a service. Related to Service Metadata (one service can have many versions). Contains the complete `spas.json` content and references to associated schemas.

- **Schema**: Represents an event or internal schema associated with a service version. Contains attributes: schemaName (string), version (string), content (JSON Schema document), schemaType (enum: event, internal), and relationship to parent Service Version.

- **Service Archive**: Represents the downloadable package containing `spas.json` and all schemas for a specific service version. Generated on-demand from stored metadata and schemas.

- **Image Reference**: Represents the OCI container image associated with a service version. Contains attributes: registry URL (string), image name (string), digest (SHA-256 hash string), and relationship to Service Version. The repository stores references only, not the actual images.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Service developers can publish service metadata with valid `spas.json` and receive success confirmation within 5 seconds for packages under 10MB
- **SC-002**: Platform operators can retrieve service metadata and download complete service archives within 2 seconds for typical service packages
- **SC-003**: Repository correctly rejects 100% of invalid `spas.json` submissions with actionable error messages
- **SC-004**: Repository prevents 100% of duplicate serviceName+version publications
- **SC-005**: Search by capability returns results within 1 second for repositories containing up to 1000 services
- **SC-006**: Repository maintains data integrity with zero data loss during normal operations
- **SC-007**: Repository can operate completely offline for PoC scenarios (no external dependencies required)
- **SC-008**: Schema evolution validation catches 100% of non-additive breaking changes when configured
- **SC-009**: Unpublish operations complete within 3 seconds and correctly remove all associated data
- **SC-010**: Repository API responses conform to documented API contract with 100% compliance for all endpoints

## Clarifications

### Session 2025-12-13

- Q: What is the source of the archive checksum for integrity validation? → A: Multipart part `checksum` (SHA-256)

Applied updates:

- Publishing: Added **FR-008a** to define `checksum` multipart part and verification behavior.

## Assumptions

- **Storage Location**: For PoC, repository will use local file system storage with a configurable base directory (default: `./spas-repository-data`)
- **Concurrent Access**: PoC implementation may use file-locking mechanisms for concurrent access; production will require proper database transactions
- **Network**: Repository service will be accessed over HTTP in PoC; production requires HTTPS with TLS
- **External Registry**: When image digest validation is enabled, repository assumes external OCI registry is accessible but does not manage registry authentication
- **Schema Format**: Initial version supports JSON Schema format; future versions may add Avro and Protocol Buffers
- **Archive Format**: Service download archives will use ZIP format with standard compression
- **API Versioning**: All endpoints will use `/v1/` path prefix to support future API evolution
- **Error Handling**: API will return standard HTTP status codes (400 for validation errors, 404 for not found, 409 for conflicts, 500 for server errors)
- **Logging**: Repository will use structured JSON logging compatible with OpenTelemetry for observability
- **Performance Baseline**: Performance targets assume services with < 100 schemas and `spas.json` files < 1MB; larger services may require adjusted expectations

## Dependencies

- **SPAS JSON Schema**: Repository requires the canonical `spas.json` schema definition for validation (referenced in principles/component/11-repository.md)
- **Package Format Specification**: Repository implementation depends on stable package format defined in principles/infrastructure/15-package-format.md
- **Versioning Strategy**: Repository must enforce versioning rules defined in principles/governance/23-versioning-strategy.md
- **Evolution Policy**: Schema validation must implement rules from principles/governance/25-evolution-policy.md
- **CLI Tool**: Repository API design assumes integration with SPAS CLI for publish/pull operations (must align with `spas-service pull <name> <version>` command structure)
- **External OCI Registry**: Repository depends on external Docker Hub/ACR/ECR for actual container image storage (repository stores references only)

## Constraints

- **PoC Scope**: Authentication, authorization, and package signing are explicitly out of scope for PoC; must be documented for production
- **Single Instance**: PoC repository runs as single instance; horizontal scaling and high availability are future considerations
- **Storage Backend**: PoC uses file-based storage; migration path to RDBMS/NoSQL must be designed but not implemented initially
- **Schema Registry Separation**: PoC integrates schema registry; production may separate into standalone service - API design should support this evolution
- **Offline-First**: Repository must work completely offline for PoC to support local development without internet connectivity

## Out of Scope

- **Container Image Storage**: Repository does not store, build, or host OCI container images - only references
- **Service Deployment**: Repository does not deploy or orchestrate services - only stores and serves metadata
- **Domain Transformations**: Transformation mappings and choreography definitions are stored separately in domain composition artifacts
- **Design-Time Metadata Aggregation**: Repository does not aggregate or compose design-time metadata - this is SDK/service responsibility
- **User Interface**: No web UI in initial version - CLI and API only
- **Image Building**: Repository does not build container images from source code
- **Service Health Monitoring**: Repository does not monitor deployed service health or availability
- **Analytics & Metrics**: Usage analytics, download metrics, and service popularity tracking are future enhancements
- **Multi-Tenancy**: PoC assumes single tenant; multi-tenant isolation is production consideration
- **Backup & Restore**: Automated backup/restore mechanisms are production operational concerns
