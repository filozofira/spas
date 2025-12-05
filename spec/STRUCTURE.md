# SPAS Framework Specification Structure

**Version:** 1.0.0  
**Last Updated:** 2025-11-25

---

## Overview

This document defines the complete structure of the SPAS (Self-contained, Portable, Adaptable Services) framework specification. The specification is organized by concern and audience to maximize maintainability, extensibility, and clarity.

---

## Document Organization Principles

1. **Separation by Concern**: Group related specifications together
2. **Audience-Focused**: Structure guides readers to relevant sections
3. **Single Source of Truth**: Each concept defined once, referenced elsewhere
4. **Stable vs Evolving**: Core principles separate from implementation details
5. **Extensibility**: Easy to add new specifications without restructuring

> Conventions
>
> - PoC vs Production: This spec uses callouts to distinguish minimal PoC behaviour from production-grade requirements.
> - Terminology: Use "Bounded Context" for a single service, "Domain Context" for a composition of services. We refer to the deployable composition artifact as a "Domain Composition" described by `choreography.yaml`.

---

## Specification Hierarchy

### **Foundation Layer** (Rarely Changes)

These documents establish the immutable principles and vision of SPAS.

```text
/spec
├── 00-introduction.md
├── 01-core-principles.md
└── 02-architecture-overview.md
```

---

### **Service Specification** (For Service Developers)

Defines what it means to build a SPAS-compliant service.

```text
/spec/service-specification
├── 03-service-model.md
├── 04-service-contract.md
├── 05-service-lifecycle.md
└── 06-service-metadata.md
```

**Audience**: Service developers, domain experts  
**Stability**: Medium (evolves with patterns)  
**Dependencies**: Foundation Layer

---

### **Protocol Specification** (Core Communication Standards)

The heart of SPAS interoperability—defines all communication protocols.

```text
/spec/protocol-specification
├── 07-communication-model.md
├── 08-grpc-protocol.md
└── 09-event-protocol.md
```

**Audience**: Service developers, platform engineers  
**Stability**: High (backward compatibility critical)  
**Dependencies**: Service Specification

---

### **Component Specification** (Platform Components)

Defines SPAS platform components and their contracts.

```text
/spec/component-specification
├── 10-sidecar-contract.md
├── 11-transformation-middleware.md
├── 12-repository-spec.md
├── 13-sdk-specification.md
└── 14-cli-specification.md
```

**Audience**: Platform engineers, SDK/CLI/tool builders  
**Stability**: Medium–High (contracts must remain compatible)  
**Dependencies**: Protocol + Service Specifications

---

### **Infrastructure Specification** (Platform Components)

Defines the runtime environment and supporting infrastructure.

```text
/spec/infrastructure
├── 15-package-format.md
├── 16-schema-registry.md
└── 17-runtime-environment.md
```

**Audience**: Platform engineers, DevOps  
**Stability**: Medium (evolves with technology)  
**Dependencies**: Component + Protocol Specifications

---

### **Tooling Specification** (Developer Experience)

Defines tools that help developers build and operate SPAS services.

```text
/spec/tooling
└── 18-testing-harness.md
```

**Audience**: Tool builders, service developers  
**Stability**: Low (evolves rapidly)  
**Dependencies**: Component + Service + Protocol Specifications

---

### **Security Specification** (Cross-Cutting Security Model)

Comprehensive security model for SPAS services and platform.

```text
/spec/security
├── 19-security-model.md
├── 20-identity-access.md
├── 21-network-security.md
└── 22-data-security.md
```

**Audience**: Security engineers, compliance teams  
**Stability**: High (security requirements stable)  
**Dependencies**: All layers

---

### **Governance** (Evolution & Compliance)

Defines how the framework and services evolve over time.

```text
/spec/governance
├── 23-versioning-strategy.md
├── 24-compliance-checklist.md
└── 25-evolution-policy.md
```

**Audience**: Framework maintainers, architects  
**Stability**: Medium (evolves with ecosystem)  
**Dependencies**: All specifications

---

### **Appendix** (Supporting Materials)

Reference materials, examples, and decision records.

```text
/spec/appendix
├── 26-reference-examples.md
├── 27-glossary.md
└── 28-decision-log.md
```

**Audience**: All  
**Stability**: N/A (living documents)  
**Dependencies**: References all specs

---

## Detailed Document Contents

### **00. Introduction**

- What is SPAS?
- Problem statement
- Design goals (self-contained, portable, adaptable)
- Target audience
- How to use this specification
- Relationship to DDD, Microservices, EDA

### **01. Core Principles**

- **Self-Contained**: No synchronous dependencies across bounded contexts
- **Portable**: OS/cloud/container agnostic
- **Adaptable**: Configuration-driven choreography participation
- **Immutable Package**: Services as immutable artifacts
- **Event-First**: Async by default for east-west
- **Zero-Trust**: Security by default

### **02. Architecture Overview**

- High-level system diagram
- Component map:
  - SPAS Services
  - SPAS Repository
  - SPAS SDK
  - SPAS CLI
  - Sidecar/Service Mesh
  - Schema Registry
  - Choreography Layer
- North-South vs East-West communication model
- Deployment topology options

---

## Service Specification Details

### **03. Service Model**

- Definition of a SPAS service
- Bounded context alignment (1 context = 1 service)
- Encapsulated domain model
- Public contract surface (APIs + Events)
- Adaptation layer (choreography binding points)
- Health and observability requirements

### **04. Service Contract**

- gRPC service definition requirements
- REST/OpenAPI exposure (north-south only)
- Event publication contract
- Event subscription contract
- State model declaration
- Consistency model declaration
  - PoC: Informative declaration only
  - Production: Commands MUST provide ACID semantics; queries MAY be eventually consistent
- Idempotency strategy declaration (service-chosen)
  - Recommended: Idempotency keys for mutating operations
  - Future: SDK may provide helpers

### **05. Service Lifecycle**

- **Authoring**: Development workflow
- **Building**: Compilation, testing, validation
- **Packaging**: Creating SPAS package
- **Publishing**: Upload to repository
- **Deployment**: Runtime instantiation
- **Adaptation**: Choreography binding
- **Operation**: Monitoring, scaling, upgrades
- **Versioning**: Semantic versioning rules
- **Retirement**: Deprecation process

### **06. Service Metadata (spas.json)**

- JSON schema definition
- Required fields:
  - `id`, `name`, `version`
  - `boundedContext`
  - `capabilities[]` (predefined enum; governance-controlled)
  - `domainContext`
- API contract reference (`grpc`, `openapi`)
- Event contracts:
  - `events.published[]` (outbound)
  - `events.subscribed[]` (inbound)
- Schema references
- Adaptation points
- Runtime requirements:
  - `runtime.image` (Docker image reference)
  - `runtime.resources`
  - `runtime.environment`
- Security metadata:
  - `security.level` (high | medium | low)
  - `security.dataClassification[]`
- License
- Examples

---

## Protocol Specification Details

### **07. Communication Model**

- **North-South** (client ↔ service):
  - Synchronous (gRPC primary, REST at edge)
  - Identity: OIDC/JWT
  - Edge layer: API Gateway pattern (external infra; e.g., Kong/NGINX/cloud gateways)
  - Responsibilities: REST→gRPC translation, auth, versioning, routing, TLS termination
- **East-West** (service ↔ service):
  - Asynchronous (events via sidecar)
  - Identity propagation
  - No direct service-to-service calls
- Sidecar responsibilities
- Protocol selection decision tree

### **08. gRPC Protocol**

- Service definition standards
- Package naming conventions
- Method naming patterns
- Error handling (gRPC status codes)
- Idempotency keys (metadata) — recommended for mutating RPCs
- Versioning strategy (package versions)
- Backward compatibility rules
- Streaming guidelines
- Timeout and retry policies
- Health check protocol

### **09. Event Protocol**

- Event envelope format:
  - Required headers: `event-id`, `event-type`, `event-version`, `timestamp`, `correlation-id`, `trace-id`
  - Optional headers: `causation-id`, `source-service`, `domain`
- Payload schema:
  - JSON Schema or Protobuf
  - Schema versioning
- Event types:
  - Domain events (business facts)
  - Technical events (system notifications)
- Topic naming conventions: `{domainContext}.{boundedContext}.{eventType}.{version}`
- Ordering semantics
- At-least-once delivery guarantee
- Idempotency: Consumer or application-level; event-id MAY be used as idempotency key
- Event filtering rules
- Schema evolution rules (additive only)

### **10. Adaptation Protocol**

- Configuration-driven transformation
- Mapping rules:
  - Domain event → Internal schema (inbound)
  - Internal schema → Domain event (outbound)
- Transformation engine requirements
- Choreography binding contract
- Composition descriptor: `choreography.yaml`
  - Lists services (id + version)
  - Event routing rules (topics)
  - Transformation mappings (domain ↔ internal)
  - Service config overrides
  - Network policies (informative; infra enforced in production)
- Runtime reconfiguration (hot-reload)
- Validation rules
- Fallback strategies
- Conflict resolution

### **11. Sidecar Contract**

- Sidecar responsibilities:
  - Traffic interception (ingress/egress)
  - Protocol translation (gRPC ↔ Events)
  - Event publishing/subscription
  - Schema validation
  - Identity propagation
  - Observability (tracing, metrics, logs)
  - Security enforcement
- Sidecar configuration format
- Communication with main service container
- Health and readiness checks
- Resource requirements
- Deployment model: Platform-injected; compatible with service meshes (e.g., Dapr/Istio/Linkerd)

---

## Infrastructure Specification Details

### **12. Package Format**

- Package structure:

  ```text
  my-service-v1.0.0/
  ├── spas.json (metadata)
  ├── schemas/ (event schemas)
  ├── docs/ (API documentation)
  └── runtime-ref.txt (Docker image reference)
  ```

- Docker image requirements:
  - Base image standards
  - Health endpoint
  - Configuration injection points
  - Observability hooks
- Signing and integrity
  - PoC: Signing OPTIONAL
  - Production: Signing REQUIRED (e.g., Docker Content Trust / Sigstore)
- Compression format
- Semantic versioning enforcement

### **13. Repository Specification**

- **Purpose**: Centralized registry for SPAS services
- **Storage model**:
  - Metadata store (RDBMS/NoSQL): `spas.json` + indexes
  - Image store: External container registry (Docker Hub, ACR, ECR)
- **API Endpoints**:
  - `POST /services` (publish metadata)
  - `GET /services/{id}` (get service details)
  - `GET /services/{id}/versions` (list versions)
  - `GET /services/{id}/versions/{version}` (get specific version)
  - `GET /services?capability={cap}` (search by capability)
  - `GET /services?domainContext={domainContext}` (search by domain context)
  - `DELETE /services/{id}/versions/{version}` (unpublish)
- **Validation**: Schema validation, duplicate detection
- **Indexing**: By `id`, `version`, `capabilities`, `domainContext`, `boundedContext`
- **Authentication** (future): Token-based auth, RBAC
- **Lifecycle policies**: Deprecation, retention, promotion

> PoC: Local repository, no authentication; integrated schema storage
>
> Production: AuthN/AuthZ (OIDC/RBAC), signed packages, policy enforcement

### **14. Schema Registry**

- **Purpose**: Manage event and message schemas
- **Storage model**:
  - Integrated with SPAS repository (PoC)
  - Schema files (JSON Schema, Protobuf), semver versioned
- **Naming convention**: `{repository}/{service}/{schema-name}/{version}`
  - Example: `my-spas-repo/order-service/order-placed/1.0.0`
- **API**:
  - `POST /schemas` (publish schema)
  - `GET /schemas/{repo}/{service}/{name}/{version}` (retrieve)
  - `GET /schemas/{repo}/{service}/{name}/versions` (list versions)
- **Compatibility checking**: Forward/backward compatibility validation
- **Schema evolution rules**: Additive-only for backward compatibility

### **15. Runtime Environment**

- **Container requirements**:
  - OCI-compliant images
  - Non-root user
  - Read-only filesystem (except data volumes)
  - Resource limits (CPU, memory)
- **Sidecar injection**: Automatic sidecar deployment
- **Platform support**:
  - Kubernetes (primary)
  - Docker Compose (local dev)
  - Bare-metal (future)
- **Networking**:
  - Service mesh integration (Istio, Linkerd, Dapr)
  - Network policies (default deny egress)
  - Enclosure levels (informative in PoC): strict | moderate | open
- **Configuration injection**: Environment variables, config maps
- **Secret management**: External secret stores (Vault, cloud KMS)
- **Observability**: Metrics, logs, traces (OpenTelemetry)
- **Security context**: Pod security policies

---

## Tooling Specification Details

### **16. SDK Specification**

- **Purpose**: Language-specific libraries to build SPAS services
- **Target languages**:
  - .NET (C#)
  - Java (Spring Boot)
  - Node.js (TypeScript)
  - Python
  - Go
- **SDK responsibilities**:
  - Code generation (gRPC stubs)
  - Metadata generation (`spas.json`)
  - Event handling abstractions
  - Sidecar client library
  - State management helpers
  - Testing utilities
  - Validation tools
- **SDK contract** (language-agnostic interface):
  - Service builder API
  - Event publisher/subscriber API
  - Configuration reader API
  - Health check API
- **Zero infrastructure dependency**: No coupling to specific messaging or storage

### **17. CLI Specification**

- **Commands**:
  - `spas init [--template <name>]`: Initialize new service
  - `spas validate`: Validate service compliance
  - `spas build`: Build service package
  - `spas pack`: Create SPAS package artifact
  - `spas push [--repo <url>]`: Publish to repository
  - `spas pull <service-id> [--version <ver>]`: Download service
  - `spas run [--local]`: Run service locally
  - `spas compose`: Create/update `choreography.yaml` for a Domain Context
  - `spas bind <config-file>`: Apply choreography binding
  - `spas schema validate <file>`: Validate schema
  - `spas schema publish <file>`: Publish schema to registry
- **Configuration**: `~/.spas/config.yaml`
- **Plugin architecture**: Extensible command system
- **Output formats**: JSON, YAML, table

### **18. Testing Harness**

- **Unit testing**: Mock event publishers/subscribers
- **Integration testing**: Local event bus emulation
- **Contract testing**: Validate against event schemas
  - Consumer-driven contracts (Pact-style)
- **Choreography simulation**: Test service in composed scenarios
- **Performance testing**: Load generation utilities
- **Test fixtures**: Sample events, schemas
- **Event replay**: Optional support for local testing
- **Generators**: SDK and harness may provide synthetic event generators

---

## Security Specification Details

- **Service identity**:
  - X.509 certificates (SPIFFE/SPIRE)
  - Short-lived tokens (15-minute TTL)
  - Automatic rotation
- **Authentication**:
  - North-South: OIDC/OAuth2 (JWT)
  - East-West: mTLS (service mesh)
- **Authorization**:
  - ABAC (Attribute-Based Access Control)
  - Policy enforcement at sidecar
- **Identity propagation**: Metadata headers in events

### **21. Network Security**

- **Sidecar enforcement**:
  - Mandatory sidecar for all traffic
  - No direct service-to-service communication
- **Egress control**:
  - Default deny all egress
  - Whitelist-based exceptions
- **Ingress control**:
  - Default: No direct ingress to services
  - API Gateway handles external traffic; services accept gRPC from edge or sidecar
- **Encryption**:
  - mTLS for all east-west traffic
  - TLS 1.3 for north-south traffic
- **Network policies**: Kubernetes NetworkPolicies or equivalent
- **Enclosure levels**:
  - PoC: Declarative only in `choreography.yaml`
  - Production: Enforced via network policies

### **22. Data Security**

- **Data classification**:
  - `public`: No restrictions
  - `internal`: Within domain only
  - `confidential`: Encrypted at rest
  - `pii`: Subject to privacy laws (GDPR, CCPA)
  - PoC: Metadata declaration only
  - Production: Enforced by sidecar/policies where applicable
- **Encryption at rest**: For `confidential` and `pii`
- **Data minimization**: Services store only domain-essential data
- **Data sovereignty**: Declare in `spas.json`
- **Privacy compliance**: Right to erasure, data portability
- **Audit logging**: All data access logged

---

## Governance Details

### **23. Versioning Strategy**

- **Semantic versioning**: `MAJOR.MINOR.PATCH`
- **API versioning**:
  - gRPC: Package version (`v1`, `v2`)
  - REST: URL path (`/v1/orders`)
  - Additive changes: minor version bump
  - Breaking changes: major version bump
- **Event versioning**:
  - Event type includes version: `order.placed.v1`
  - Schema evolution: Additive-only (backward compatible)
  - New fields: Optional with defaults
- **Metadata versioning**: `spas.json` schema version
- **Deprecation policy**:
  - Minimum support window: 6 months
  - Deprecation notice in metadata
  - Breaking changes require migration guide

### **24. Compliance Checklist**

- **SPAS Certification Requirements**:
  - [ ] Single bounded context
  - [ ] No synchronous cross-context dependencies
  - [ ] Valid `spas.json` metadata
  - [ ] gRPC service definition
  - [ ] Event contracts (published/subscribed)
  - [ ] Docker image available
  - [ ] Health endpoints implemented
  - [ ] Declared idempotency strategy
  - [ ] Declared consistency model (commands ACID; queries MAY be eventual)
  - [ ] Security requirements met
  - [ ] Observability hooks
  - [ ] Documentation complete
- **Validation tooling**: `spas validate` CLI command
- **Repository enforcement**: Automated compliance checks on publish

### **25. Evolution Policy**

- **Backward compatibility**:
  - Events: Additive-only changes
  - APIs: Versioned endpoints
  - Metadata: New fields optional
- **Forward compatibility**: Consumers ignore unknown fields
- **Breaking change process**:
  1. Deprecation announcement
  2. Parallel support (old + new)
  3. Migration guide
  4. Sunset date
  5. Removal
- **Protocol evolution**: SPAS Improvement Proposals (SIPs)
- **Contribution model**: Open source governance

---

## Appendix Details

### **26. Reference Examples**

- **Order Service (Telecom Domain)**:
  - Domain model
  - Event contract
  - Adaptation mappings
  - Choreography configuration
- **Order Service (Retail Domain)**:
  - Same domain model
  - Different event types
  - Different adaptation mappings
  - Demonstrates reusability
- **Payment Service**
- **Notification Service**

### **27. Glossary**

- **Bounded Context**: DDD concept, domain model boundary
- **Domain Context**: A composition scope that binds multiple SPAS services to deliver a specific domain solution
- **Domain Composition**: The deployable description of a Domain Context, defined by `choreography.yaml`
- **Choreography**: Event-driven service composition
- **North-South**: Client-to-service communication
- **East-West**: Service-to-service communication
- **Sidecar**: Helper container for cross-cutting concerns
- **Adaptation**: Configuration-driven event transformation
- **Domain Event**: Business fact (past tense)
- **Canonical Schema**: Domain-specific event format
- **Internal Schema**: Service-specific event format

### **28. Decision Log (ADRs)**

- **ADR-001**: Why gRPC over REST for service APIs?
- **ADR-002**: Why sidecar pattern for events?
- **ADR-003**: Why no service-to-service sync calls?
- **ADR-004**: Why external container registry?
- **ADR-005**: Why additive-only event evolution?
- **ADR-006**: Why zero-trust security model?
- **ADR-007**: POC vs Production trade-offs
- **ADR-008**: Why single bounded context per service?

---

## Document Maintenance

### **Update Frequency by Layer**

| Layer | Frequency | Trigger |
|-------|-----------|---------|
| Foundation | Rarely | Fundamental principle change |
| Service Specification | Quarterly | New patterns discovered |
| Protocol Specification | Semi-annually | Interoperability issues |
| Infrastructure | As needed | Technology evolution |
| Tooling | Monthly | Developer feedback |
| Security | Annually | Threat model review |
| Governance | Annually | Ecosystem growth |

### **Change Process**

1. Propose change (GitHub issue or SIP)
2. Review by maintainers
3. Impact analysis (breaking vs non-breaking)
4. Update affected documents
5. Version specification if breaking
6. Publish changelog

### **Cross-References**

Each document includes a "Related Documents" section linking to dependencies and related specs.

---

## Navigation Guide

### **I want to...**

- **Build a SPAS service** → Start with `/service-specification`
- **Understand communication** → Read `/protocol-specification`
- **Deploy services** → See `/infrastructure`
- **Build tooling** → Check `/tooling`
- **Ensure security** → Review `/security`
- **Manage framework evolution** → Read `/governance`
- **See examples** → Browse `/appendix/26-reference-examples.md`

---

## Next Steps

1. Review this structure proposal
2. Approve or iterate
3. Migrate content from `/design/README.md` to new structure
4. Create templates for each document
5. Begin writing/migrating content
6. Establish governance process

---

**Specification Maintainers**: SPAS Core Team  
**Feedback**: Submit issues or proposals via GitHub
