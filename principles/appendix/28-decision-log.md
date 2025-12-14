# Decision Log (ADRs)

## Foundational

- ADR-001: gRPC over REST for service APIs (Production)
- ADR-002: Sidecar pattern for events and policy enforcement
- ADR-003: No direct service-to-service communication (all traffic flows through sidecars)
- ADR-004: External container registry references
- ADR-005: Additive-only event evolution
- ADR-006: Zero-trust security model (Production)
- ADR-007: PoC vs Production markers in spec
- ADR-008: Single bounded context per service

## PoC-Specific (December 2025)

- ADR-009: HTTP-only transport in PoC; gRPC deferred to Production
- ADR-010: Custom SPAS sidecar component for PoC (DAPR evaluation complete; incompatible with pub/sub transformation requirements)
- ADR-011: Identity propagation via CloudEvents payload in PoC (middleware injection future)
- ADR-012: Sidecar-based transformations using SPAS sidecar component
- ADR-013: SQLite repository storage in PoC (embedded, ACID transactions, JSON queries); PostgreSQL (JSONB) + S3 target for Production. Storage abstraction layer (IStorageProvider) required for migration path.
- ADR-014: Design-time metadata decomposition + Design-time endpoints for service introspection
- ADR-015: mTLS deferred; no SPIFFE/SVID in PoC
- ADR-016: Zipkin-only observability in PoC (Prometheus future)
- ADR-017: Contract testing deferred from PoC
- ~~ADR-018: Direct DAPR pub/sub calls~~ **DROPPED** (Dec 2025): DAPR evaluation found HTTP middleware incompatible with pub/sub. Using SPAS sidecar with Redis pub/sub instead. CAP/outbox pattern deferred to SDK Phase 2.
- ADR-019: Monorepo structure for PoC development (co-located SDK, CLI, Sidecar, and Examples)
- ADR-020: Sidecar-mediated service invocation for command/query patterns (Dec 2025): Sidecars can invoke services directly via configured HTTP endpoints (PoC) or gRPC methods (Production) for command and query handling, in addition to event-driven flows. Invocation rules configured in `choreography.yaml`. Maintains principle of no direct service-to-service communication (all traffic mediated by sidecars). Enables request-response patterns while preserving sidecar responsibilities for transformation, observability, and policy enforcement.

## Design & Operations (December 2025)

- ADR-021: Service capabilities model: Predefined enum (e.g., `order-management`, `payment-processing`, `inventory-tracking`). Start with enum; extend to hybrid (predefined + custom:prefix) in future.
- ADR-022: Data classification scheme: Four levels (`public`, `internal`, `confidential`, `pii`) declared as metadata in PoC. Enforcement strategy (sidecar, repository, or infrastructure) to be determined during implementation based on community feedback.
- ADR-023: Network enclosure levels (`strict`, `moderate`, `open`) defined as metadata in PoC. Runtime enforcement production-only; likely delegated to service mesh (infrastructure concern) rather than SPAS framework.
- ADR-024: Service dependency declarations deferred: Library and infrastructure dependencies not required in v1.0. Focus on event dependencies only (already covered in `events.subscribed[]`). Reconsider for future versions if community finds it valuable.
- ADR-025: Sidecar architecture - Hybrid approach: Custom SPAS sidecar for PoC transformation and messaging (Node.js initially, Go migration possible per ADR-038); compatible with standard service meshes (Istio, Linkerd) for production mTLS and policy enforcement.
- ADR-026: API Gateway not a SPAS component: Teams choose existing gateways (Kong, NGINX, cloud gateways, Ocelot). Gateway handles TLS termination, authentication, routing; Production: REST→gRPC translation; PoC: HTTP only. SPAS provides identity propagation mechanism for authorization.
- ADR-027: Orchestration excluded from v1.0: Pure choreography only. Orchestration patterns deferred to v2.0 or separate specification.
- ADR-028: Single specification with PoC/Production markers: Unified spec document with inline markers distinguishing PoC simplifications from production requirements. Avoids maintenance burden of dual spec tracks.
- ADR-029: Schema registry integrated into SPAS repository: Schemas stored in repository database. Separation to standalone registry (Confluent, AWS Glue) deferred to production scaling phase.
- ADR-030: Domain terminology standardized: Use "Bounded Context" (single service boundary, DDD term) and "Domain Context" (composition of services). Remove "SPAS Domain" to reduce ambiguity. Future consideration: standardized term for "system built by composing SPAS services in a domain context".
- ADR-031: State management permissive approach: Services decide their own state pattern (event sourcing, CRUD, etc.), consistency model (ACID or eventual), and persistence (external store vs. in-memory). Framework provides guidance through service model spec; no prescriptive enforcement.
- ADR-032: Deployment descriptor (`choreography.yaml`): Serves as backing store for choreography configuration. spas-cli generates per-instance sidecar JSON configuration containing topic mappings, transformation functions, service endpoints, and trace context settings. Creation is mixed manual + generated; future CLI improvements anticipated.
- ADR-033: Contract testing approach: Consumer-Driven Contracts (Pact-style) where consumers define expectations and providers validate. Event replay optional (nice to have); synthetic event generation primarily developer responsibility in PoC, SDK support to follow.
- ADR-034: Infrastructure vs. business logic configuration segregation (Dec 2025): Infrastructure configuration (Redis host/port, Zipkin URL, etc.) specified as environment variables in deployment manifests (docker-compose, Kubernetes). Business logic and choreography configuration (topic mappings, transformations, routing rules) specified in sidecar config files. Rationale: Enable environment-specific overrides without rebuild; keep business logic configuration portable across infrastructure platforms; support 12-factor app principles.
- ADR-035: Simplified CLI publish workflow (Dec 2025): Consolidate `spas-service metadata get`, `pack`, and `publish` into single `publish` command with `--dry-run` and `--archive` flags. SDK's `/_spas/metadata` endpoint already produces complete ZIP archive, eliminating need for separate pack step. `--dry-run` enables inspection without publishing (replaces metadata get). `--archive` enables CI/CD pipelines to publish pre-built archives without running service. Rationale: Reduces developer friction, leverages existing SDK capability, maintains full workflow coverage with fewer commands. Constitution compliance: `--dry-run` satisfies `metadata get` + `pack` intent; `--archive` supports offline scenarios.
- ADR-036: JSONata for transformation files (Dec 2025): Use `.jsonata` files for message transformations instead of `.js` (JavaScript). JSONata is a declarative, JSON-focused query and transformation language with implementations in both Node.js (`jsonata`) and Go (`jsonata-go`). Rationale: Enables sidecar language flexibility (Node.js PoC, potential Go migration for performance); human-readable expressions suitable for AI generation; version-controllable; no runtime dependency conflicts. Transformation files organized per-service: `transformations/<service-name>/*.jsonata`.
- ADR-037: AI-in-the-loop composition for spas-compose (Dec 2025): Choreography composition uses AI agent (`/spas.compose` prompt) for iterative contract analysis and transformation generation. CLI provides scaffolding (`init`), metadata retrieval (`services pull`), and deployment (`choreography deploy`); AI assists with semantic matching of event contracts, proposing topic mappings, and generating JSONata transformation files. Developer confirms each step via iterative prompt loop. Rationale: Choreography composition involves semantic understanding unsuited for deterministic CLI; leverages GitHub SpecKit patterns; reduces command complexity while improving accuracy.
- ADR-038: Sidecar language flexibility (Dec 2025): Sidecar implementation language not locked to Node.js. PoC uses Node.js (existing prototype, rapid iteration); Production may migrate to Go for performance. ADR-036 (JSONata) ensures transformation files work in both runtimes. Sidecar contract remains stable regardless of implementation language.

## Pending Decisions (December 2025)

These decisions are deferred, require further clarification, or have been partially decided with implementation details still open.

### 1. Validation & Consistency

#### ACID Guarantees Requirement

**Status**: 🟡 Partially Decided

**Current Requirement**: "Inbound endpoints handling commands MUST provide ACID guarantees"

**Question**: Clarify scope and rationale for event-driven systems.

**Context**:

- Decision ADR-031 states: "Commands are ACID, queries can be eventual"
- Additional note: "ACID and idempotency guarantees when handling a single event—if event handling returns ok, that state change should be consistent"
- Each SPAS service manages a single bounded context (ADR-008)

**Clarifications Needed**:

1. Does ACID requirement apply to:
   - [ ] All inbound endpoints?
   - [x] Commands only (not queries or read operations)?
   - [ ] A per-endpoint declaration?

2. Rationale: Why is this necessary?
   - [ ] Prevent data corruption in bounded context
   - [ ] Ensure idempotency semantics
   - [ ] Simplify choreography error handling
   - [ ] Other: _________________

3. How strict is the requirement?
   - [ ] ACID mandatory for all commands
   - [ ] ACID recommended, service can declare weaker guarantees
   - [ ] Context-dependent

**Your Clarification**: _________________

---

#### Idempotency Implementation & Enforcement

**Status**: 🟡 Partially Decided

**Current Decision**: Service decides implementation approach (ADR-033).

**Deferred Implementation Details**:

1. **PoC Phase**: Developer responsibility for idempotency
   - [ ] Confirmed
   - [ ] Need guidance on idempotency key format
   - [ ] Need SDK helper for deduplication

2. **Future Phases**: Consider SDK or sidecar support
   - [ ] SDK-level idempotency cache/key management
   - [ ] Sidecar-level request deduplication
   - [ ] Distributed idempotency cache (Redis?)

3. **Configuration**: Idempotency window duration
   - [ ] Default window (e.g., 24 hours)?
   - [ ] Per-service configuration?
   - [ ] Per-endpoint granularity?

**Your Input**: _________________

---

### 2. Architecture & Deployment

#### Multi-Tenancy Support

**Status**: 🔴 Out of Scope for v1.0

**Question**: Should SPAS framework support multi-tenancy?

**Scenarios**:

1. Single service instance serves multiple tenants (SaaS model)
2. One service instance per tenant (isolation model)

**v1.0 Decision**: Out of scope for v1.0

**Future Consideration** (v2.0+):

1. **Tenant Identity Propagation**: Framework responsibility?
   - [ ] SPAS must provide tenant ID propagation mechanism (header, claim, event metadata)
   - [ ] Domain/service implementation responsibility
   - [ ] Both (framework enables, domain decides)

2. **Message Routing**: Where is responsibility?
   - [ ] SPAS sidecar routes to correct tenant infrastructure (topics, queues)
   - [ ] Service owns tenant routing logic
   - [ ] Shared responsibility with clear boundaries

3. **Enforcement**: Should all SPAS services support multi-tenancy?
   - [ ] Yes—require all services to handle tenant context
   - [ ] Optional—services opt-in to multi-tenancy support
   - [ ] Domain-level—multi-tenancy is domain-context decision, not service-level

**Your Input (for future planning)**: _________________

---

#### Serverless Deployment Feasibility

**Status**: 🟡 Deferred to v2.0

**Current Decision**: Container-based deployments only; serverless deferred.

**Question**: Can SPAS services run on serverless platforms (AWS Lambda, Azure Functions, Google Cloud Functions)?

**Considerations**:

1. **Cold Start Impact**: How severe for choreography latency?
   - Acceptable: < 1 second cold start
   - Acceptable: < 5 seconds with eventual consistency
   - Not acceptable for real-time choreography

2. **State Limitations**: Serverless functions have ephemeral storage
   - [ ] In-memory state acceptable (stateless services)
   - [ ] Requires external state store (supported via ADR-031 guidance)
   - [ ] Incompatible with choreography state requirements

3. **Sidecar Compatibility**: Can SPAS sidecar run in serverless?
   - [ ] As separate Lambda/function instance
   - [ ] Sidecar embedded in function package
   - [ ] Not applicable (serverless too stateless)

4. **Message Broker Access**: Serverless to Redis Streams?
   - [ ] VPC integration overhead acceptable
   - [ ] Managed service (AWS Kinesis, Azure Event Hubs) preferred
   - [ ] Requires platform-specific adapters

**Your Assessment (for v2.0 evaluation)**: _________________

---

### 3. Security & Governance

#### Package Signing & Integrity

**Status**: 🟡 Partially Decided

**Current Decision**:

- **PoC**: No signing required (simplicity)
- **Production**: Cryptographic signing required (like Docker Content Trust)

**Implementation Details Deferred**:

1. **Signing Authority**:
   - [ ] Internal organizational PKI
   - [ ] External CA (Let's Encrypt, corporate CA)
   - [ ] Per-team signing keys
   - [ ] Central repository signing key

   **Your Approach**: _________________

2. **Key Management**:
   - [ ] Git-based key distribution (not recommended)
   - [ ] Secret management system (HashiCorp Vault, Azure Key Vault)
   - [ ] CI/CD environment variables
   - [ ] HSM (Hardware Security Module) for production

   **Your Approach**: _________________

3. **Verification Points** (check all that apply):
   - [ ] Repository (when package is registered)
   - [ ] Deployment (when service is deployed)
   - [ ] Runtime (when service container starts)
   - [ ] All of the above

   **Your Approach**: _________________

4. **Signature Scope**:
   - [ ] Entire SPAS package (metadata + schemas)
   - [ ] Service image only
   - [ ] Sidecar configuration
   - [ ] All artifacts

   **Your Approach**: _________________

**Your Input on Implementation Strategy**: _________________

---

#### Observability Standards Revisit

**Status**: 🟡 Selected but Needs PoC Validation

**Current Selection**:

- [x] OpenTelemetry (traces, metrics, logs)
- [x] Prometheus metrics format
- [x] Structured logging (JSON)
- [x] Distributed tracing (W3C Trace Context)
- [x] Health check format (HTTP `/health`, `/ready`)

**PoC Validation Needed**:

**Question**: During PoC development, which observability requirements should we prioritize vs. defer?

**Tradeoff Considerations**:

1. **Tracing** (currently Zipkin-only, ADR-016):
   - Continue Zipkin-only for PoC?
   - Add Prometheus metrics from start?
   - Defer comprehensive metrics to v2.0?

2. **Metrics Collection**:
   - Core metrics only (request rate, errors, latency p50/p95/p99)?
   - Include event publish/consume rates?
   - Domain-specific custom metrics?

3. **Logging**:
   - JSON structured logging mandatory?
   - Unstructured logs acceptable for PoC?
   - Log aggregation (ELK, Loki) scope?

4. **Health Checks**:
   - `/health` endpoint (liveness) required?
   - `/ready` endpoint (readiness) required?
   - Optional for PoC?

**Your PoC Priorities**: _________________

---

### 4. Future Scope (v2.0+)

#### Terminology: System Composition Term

**Status**: 🟡 Partially Decided

**Current Decision**: Use Bounded Context (single service) and Domain Context (service composition).

**Open Question**:

ADR-030 notes: "Future consideration: standardized term for 'system built by composing SPAS services in a domain context'"

**Options**:

- [ ] **Domain System**: The concrete system built within a domain context
- [ ] **Choreography Instance**: A deployed composition of services
- [ ] **SPAS Composition**: The result of composing services
- [ ] **Domain Implementation**: The working system in a domain
- [ ] **Platform Instance**: The deployed domain platform
- [ ] **Other**: _________________

**Proposed Term**: _________________

**Rationale**: _________________

---

### Summary of Pending Decisions

**Total Pending Items**: 6 categories

1. ACID Guarantees - Clarification on scope
2. Idempotency - Implementation strategy and deferral details
3. Multi-Tenancy - Future responsibility boundaries (v2.0+)
4. Serverless - v2.0 feasibility evaluation
5. Package Signing - Implementation details (production-only)
6. Observability - PoC prioritization and tradeoffs

**Next Steps**:

1. Provide clarifications for items in this section
2. For deferred items (Multi-Tenancy, Serverless, Terminology): Input appreciated but not blocking v1.0
3. Updated decisions will be added to this log as new ADRs

## Related Documents

- [Evolution Policy](../governance/25-evolution-policy.md)
- [INDEX](../INDEX.md)
- [Glossary](27-glossary.md)
