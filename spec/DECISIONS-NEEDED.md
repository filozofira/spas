# SPAS Framework - Critical Decisions Needed

**Purpose**: Resolve open design questions before migration  
**Status**: 🔴 Awaiting Decisions  
**Date**: 2025-11-24

---

## Instructions

Please provide your decision for each question. Your answers will directly inform the specification structure and content.

**Format for answers:**

- ✅ = Your chosen option
- 📝 = Additional notes/clarifications

---

## 1. Protocol Decisions

### A. Capabilities Model

**Question**: Should service capabilities be predefined or free-text?

**Options**:

- [ ] **Option A**: Predefined enum (e.g., `order-management`, `payment-processing`, `inventory-tracking`)
  - ✅ Better searchability, validation, tooling
  - ❌ Less flexible, requires governance
  
- [ ] **Option B**: Free-text tags (any string)
  - ✅ Maximum flexibility
  - ❌ Inconsistent naming, harder to search
  
- [ ] **Option C**: Hybrid - predefined with custom prefix (e.g., `custom:my-capability`)
  - ✅ Balance of structure and flexibility
  - ❌ Requires both validation strategies

**Your Decision**: Option A

**Additional Notes**:
Start with A but should extend to C in future.

---

### B. Data Classification Values

**Question**: Finalize data classification levels and enforcement strategy.

**Proposed Values**:

- `public`: No restrictions, can be shared externally
- `internal`: Within organization/domain only
- `confidential`: Encrypted at rest, restricted access
- `pii`: Personally Identifiable Information, subject to privacy laws (GDPR, CCPA)

**Questions**:

1. Are these values correct? Any additions/changes needed?

   **Your Answer**: This is complete list.

2. How should this be enforced?
   - [ ] Metadata declaration only (documentation)
   - [ ] Sidecar enforcement (runtime validation)
   - [ ] Repository validation (admission control)
   - [ ] All of the above

   **Your Decision**: In POC this will be only Metadata declaration only, but we should aim during implementation to enable extending to something Sidecar enforcement or what ever we find best at that time. We must answer first who is responsible (SPAS framework or domain developers).

3. Should services declare classification per-field or per-service?
   - [ ] Per-service (entire service is one classification level)
   - [ ] Per-endpoint (different APIs have different levels)
   - [ ] Per-field (granular schema annotations)

   **Your Decision**: See answer to question 2, i.e. we start with Metadata declaration only, but later might extend to enforce this in a most appropriate way, depending on what we learn from community.

**Additional Notes**:

---

### C. Enclosure Levels (Network Security)

**Question**: Define what `strict | moderate | open` network enclosure means.

**Proposed Definitions**:

| Level | Egress Rules | Use Case |
|-------|--------------|----------|
| `strict` | Zero egress (except SPAS control plane) | Sensitive services, no external deps |
| `moderate` | Whitelist-based egress (explicit URLs/IPs) | Services needing specific external APIs |
| `open` | Allow all egress (with monitoring) | Integration services, legacy migration |

**Questions**:

1. Do these definitions match your intent?

   **Your Answer**: Yes they do, but note that currently we assume that we will NOT use SPAS control plane, hence SPAS control plane can be eliminated for now.

2. Should ingress also have levels, or is ingress always controlled?

   **Your Answer**: Per default no SPAS service will NOT have ingress configured, hence only Edge layer services (i.e. API gateway) can communicate with it via gRPC.

3. Is this a PoC feature or production-only?
   - [ ] PoC: Document only, no enforcement
   - [ ] Production: NetworkPolicy enforcement

   **Your Decision**: Assume security enforcement would be  production-only feature depending on the implementation, i.e. if chosen implementation allows easy setup on local machine. In any case, question is not relevant since we start with Metadata declaration only.

**Additional Notes**: I think this concept is in general not well thought through. I.e. there are thoughts to use service-mesh to secure communication in which case this would be Metadata declaration only, while security is an infrastructure concern.

---

### D. Service Dependencies

**Question**: Clarify what "dependencies" means in SPAS context.

**Dependency Types**:

1. **Runtime Service Dependencies**: Synchronous calls to other services
   - Your principle: ❌ NOT ALLOWED (except via events)

2. **Library Dependencies**: Code libraries (npm, Maven, NuGet packages)
   - Should these be declared in metadata?
   - [ ] Yes - for transparency and security scanning
   - [ ] No - internal implementation detail

   **Your Decision**: You can drop dependencies, since we will not deal with dependencies yet. We might use it in future, but let's see by then.

3. **Infrastructure Dependencies**: Databases, message brokers, caches
   - Should these be declared?
   - [ ] Yes - for deployment planning
   - [ ] No - abstracted by runtime

   **Your Decision**: We will not deal with dependencies yet. We might use it in future, but let's see by then.

4. **Event Dependencies**: Events this service consumes
   - Already covered in `events.subscribed[]` ✅

**Additional Notes**: Although it is nice to Declare library dependencies for transparency I think we can drop dependencies to keep things simple and add that if community finds it helpful.

---

## 2. Architecture Clarifications

### E. Sidecar vs Service Mesh

**Question**: Clarify sidecar architecture and ownership.

**Questions**:

1. Is the sidecar:
   - [ ] Part of the service package (included in Docker image)
   - [x] Injected by platform (Kubernetes, service mesh)

   **Decision (Dec 2025)**: Platform-injected sidecar approach confirmed.
   - **PoC**: Custom SPAS sidecar component (Node.js) for transformation and messaging
   - **Production**: Compatible with standard service meshes (Istio, Linkerd) for mTLS and policy enforcement

2. Are you building a custom sidecar or leveraging existing service mesh?
   - [x] Custom sidecar (SPAS-specific implementation) for PoC
   - [x] Standard service mesh (Istio, Linkerd) for Production
   - [x] Flexible: Support both

   **Decision (Dec 2025)**: Hybrid approach - custom SPAS sidecar for transformation logic, service mesh for infrastructure concerns.

3. What language/tech for sidecar (if custom)?

   **Decision (Dec 2025)**: Node.js 18 for PoC SPAS sidecar component.
   - Rapid prototyping capability
   - Native async/await for Redis pub/sub
   - Simple JSON configuration and transformation
   - Proven in prototype: `prototypes/spas-sidecar-prototype/`

**Implementation Notes (Dec 2025):**

- **DAPR Evaluation**: Completed. DAPR HTTP middleware does not intercept pub/sub messages (only north-south traffic).
- **Solution**: Custom SPAS sidecar component handling:
  - Message transformation (domain ↔ internal contracts)
  - CloudEvents 1.0 wrapping with W3C Trace Context
  - Redis pub/sub integration
  - Zipkin distributed tracing with correlated traces
- **Production Path**: SPAS sidecar for choreography, service mesh (Istio/Linkerd) for mTLS, policy, and observability infrastructure.

---

### F. API Gateway / Edge Layer

**Question**: Is API Gateway part of SPAS or external infrastructure?

**Options**:

- [ ] **SPAS Component**: Framework provides/specifies API Gateway
  - Need to define gateway implementation
  - More control, more complexity
  
- [ ] **External Infrastructure**: Use existing gateways (Kong, NGINX, cloud gateways)
  - SPAS only defines REST→gRPC contract
  - Less complexity, more flexible
  
- [ ] **Hybrid**: SPAS provides reference implementation, but optional
  
**Your Decision**: Not a SPAS component—use existing gateways (Kong, NGINX, cloud gateways, Ocelot) i.e. it will be a free choice of the team composing the SPAS Domain.

G. Orchestration

**Gateway Responsibilities** (check all that apply):

- [x] REST → gRPC translation
- [x] Authentication (JWT validation)
- [ ] Rate limiting
- [x] API versioning
- [x] Request routing
- [x] TLS termination

**Additional Notes**: API gateway will expose ingress endpoints to external actors, such as frontend applications or other services. Incoming requests would be routed to any SPAS service deployed in given SPAS Domain. As such the authentication method will be chosen by the team developing the domain, while SPAS needs provide methods to propagate the identity in secured way, so that services can authorise operations if needed.

---

### G. Orchestration vs Choreography

**Question**: Should orchestration patterns be in scope for v1.0?

**Your Current Position**:
> "POC / Simplicity: Favor pure choreography... orchestration optional extension"

**Options**:

- [x] **Choreography Only**: v1.0 spec excludes orchestration entirely
  - Simpler, more aligned with "self-contained" principle
  - Defer orchestration to v2.0 or separate spec
  
- [ ] **Include Both**: Document both patterns with guidance
  - More comprehensive
  - Risk of complexity, diluted focus
  
- [ ] **Choreography Primary, Orchestration Appendix**: Main spec is choreography, orchestration in optional appendix
  
**Your Decision**: Choreography Only

**Additional Notes**:

---

## 3. Implementation Scope

### H. PoC vs Production Specification Strategy

**Question**: How should we handle PoC vs Production differences in the spec?

**Options**:

- [ ] **Option A**: Two separate specification tracks

  ```
  /spec/poc/        (simplified, no auth, local)
  /spec/production/ (full security, distributed)
  ```
  
- [X] **Option B**: Single spec with PoC/Production markers

  ```markdown
  > **PoC**: Local repository, no authentication  
  > **Production**: Distributed repository, OIDC authentication, RBAC
  ```
  
- [ ] **Option C**: Production spec only, PoC is just simplified deployment
  
**Your Decision**: Single spec with PoC/Production markers

**PoC Requirements** (what MUST work in PoC):

- [X] Local SPAS repository
- [X] Service packaging
- [X] Service deployment
- [X] Event choreography
- [X] Basic validation
- [X] No authentication
- [ ] Other: _________________

**Additional Notes**: When I crossed No authentication, it was meant for SPAS repository, the SPAS services and Domain must support authentication and authorisation.

---

### I. Schema Registry Architecture

**Question**: Is schema registry a separate service or integrated with SPAS repository?

**Options**:

- [X] **Integrated**: Schemas stored in SPAS repository database
  - ✅ Simpler for PoC, atomic updates
  - ❌ Harder to scale independently
  
- [ ] **Separate Service**: Dedicated schema registry (like Confluent Schema Registry)
  - ✅ Better separation of concerns, scalable
  - ❌ More complexity, additional infrastructure
  
- [ ] **PoC Integrated, Production Separate**
  
**Your Decision**: Integrated

**If separate, which implementation**:

- [ ] Confluent Schema Registry
- [ ] AWS Glue Schema Registry
- [ ] Custom SPAS Schema Registry
- [ ] Pluggable (support multiple backends)

**Additional Notes**:

---

## 4. Terminology Consistency

### J. Domain Terminology

**Question**: Standardize usage of domain-related terms.

**Current Inconsistencies**:

- "bounded context" (DDD term)
- "domain context" (choreography scope?)
- "SPAS Domain" (ecosystem?)

**Proposed Standard Terminology**:

| Term | Definition | Example |
|------|------------|---------|
| **Bounded Context** | Single service boundary (DDD) | `OrderManagement`, `PaymentProcessing` |
| **Domain Context** | Composition of services for specific domain | `TelecomDomain`, `RetailDomain` |
| **SPAS Domain** | The entire SPAS ecosystem | All services across all contexts |
| **Choreography** | Event-driven composition within a domain context | Order→Payment→Fulfillment flow |

**Questions**:

1. Do these definitions work for you?

   **Your Answer**: Consider removing SPAS Domain and stick with Bounded Context and Domain Context.

2. Any alternative terms you prefer?

   **Your Answer**: I am missing a term for something that resembles the system developers build by reusing SPAS Services for specific Domain Context. Can you find a good name for that?

**Additional Notes**:

---

### K. "Domain Choreography" Term

**Question**: Is "Domain Choreography" distinct from "Choreography"?

- [X] Same thing (use "choreography" consistently)
- [ ] Different: "Domain Choreography" = choreography within a specific domain context
- [ ] Different: "Domain Choreography" = ___________________

**Your Decision**: Same thing (use "choreography" consistently)

**Additional Notes**:

---

## 5. Missing Critical Specs

### L. State Management Requirements

**Question**: What are the state management requirements for SPAS services?

**Questions**:

1. Should services use a specific state pattern?
   - [X] No opinion (service decides)
   - [ ] Event Sourcing recommended
   - [ ] Event Sourcing required
   - [ ] Traditional CRUD allowed

   **Your Decision**: No opinion (service decides)

2. State persistence requirements:
   - [ ] MUST use external state store (database, not in-memory)
   - [ ] MAY use in-memory state (for stateless services)

   **Your Decision**: No opinion (service decides)

3. State consistency model:
   - [ ] MUST provide ACID guarantees for all state changes
   - [X] MUST provide clear consistency guarantees (ACID or eventual)
   - [X] Service decides based on use case

   **Your Decision**: See

4. Snapshotting requirements:
   - [ ] Required for event-sourced services
   - [ ] Optional
   - [X] Not specified

   **Your Decision**:

**Additional Notes**: The idea is to build framework which is not that opinionated while promoting ideas via SPAS Service Model or Specification. The only important thing is that SPAS Service exposes a gRPC API as well as contracts to which north-south or east-west communication can be routed, etc.  

---

### M. Deployment Descriptor / Domain Composition

**Question**: How do you specify which services participate in a domain context?

**Need to Define**:

1. File format for domain composition
   - [ ] `domain.yaml`
   - [ ] `choreography.yaml`
   - [ ] `spas-domain.json`
   - [ ] Other: _________________

   **Decision (Dec 2025)**: `choreography.yaml` - spas-cli uses this as backing store for choreography configuration, serving as base to visualize choreography and as intermediate state before deployment.

   **Implementation**: spas-cli generates SPAS sidecar configuration JSON files (per service instance) containing:
   - Topic subscription/publication mappings
   - Transformation function references
   - Service endpoint URLs
   - Trace context propagation settings

2. What goes in this file?
   - [X] List of services (by ID and version)
   - [X] Event routing rules (topic mappings)
   - [X] Transformation mappings (event → schema)
   - [X] Service configuration overrides
   - [X] Network policies
   - [ ] Other: _________________

   **Decision (Dec 2025)**: Choreography configuration will be adapted to SPAS sidecar component requirements (topic mappings, transformation functions, service endpoints).

3. Who creates/manages this file?
   - [ ] Platform engineer
   - [ ] Domain architect
   - [ ] Generated by CLI (`spas compose`)
   - [X] Mix of manual + generated

   **Your Decision**: I guess in POC there will be more manual labour while in future I see CLI tool being smarter and smarter. I also see a possibility for AI, specially if we can define some good prompts, allowing AI to create choreographies, or at least have a best shot at it.

**Additional Notes**:

---

### N. Testing Strategy

**Question**: Define contract testing approach for events.

**Contract Testing Options**:

1. **Consumer-Driven Contracts** (Pact-style):
   - Consumers define expectations
   - Providers validate against consumer contracts
   - [X] Use this approach

2. **Provider-Driven Contracts** (Schema-first):
   - Providers publish schemas
   - Consumers validate their usage
   - [ ] Use this approach

3. **Bidirectional** (both):
   - Schema registry as truth
   - Both sides validate
   - [ ] Use this approach

**Your Decision**: Consumer-Driven Contracts Pact-style

**Event Replay for Testing**:

- [ ] Required: Services must support event replay
- [X] Optional: Nice to have
- [ ] Not specified

**Synthetic Event Generation**:

- [X] SDK provides event generators/fixtures
- [X] Developer responsibility
- [X] Testing harness provides generators

**Your Decisions**: I guess in POC it will be very much Developer responsibility but in future we can provide SDK for this or test harness.

**Additional Notes**:

---

## 6. Validation Questions

### O. ACID Guarantees Requirement

**Current Requirement**: "All inbound endpoints MUST provide ACID guarantees"

**Question**: Is this too strict for event-driven systems?

**Considerations**:

- Many DDD/event-sourced systems use eventual consistency
- ACID may force specific database choices
- Conflicts with "portable" principle if too prescriptive

**Revised Options**:

- [ ] **Keep Current**: ACID required (strong consistency)
- [ ] **Relax**: "MUST provide clear consistency guarantees" (ACID or eventual)
- [ ] **Per-Endpoint**: Services declare consistency model per endpoint
- [X] **Command/Query Split**: Commands are ACID, queries can be eventual

**Your Decision**: Commands are ACID, see also Additional notes

**Additional Notes**: When I wrote this I was thinking about ACID and idempotency guaranties when handling single event, i.e. if event SPAS Service returns ok from handling an event, than s that part of the state should be consistent. Remember each SPAS service is built to manage a single bounded context. What do you think.

---

### P. Idempotency Implementation

**Current Requirement**: "All inbound endpoints MUST be idempotent"

**Questions**:

1. How is idempotency achieved?
   - [ ] Idempotency keys in request metadata (like Stripe API)
   - [ ] Natural idempotency (PUT/DELETE operations)
   - [ ] Application-level deduplication
   - [X] Service decides implementation

   **Your Decision**: Service decides. See also additional notes.

2. Should SDK provide idempotency helpers?
   - [ ] Yes - caching layer, key generation
   - [X] No - service responsibility

   **Your Decision**: No for POC but could be a nice thing to extend in future. I.e. caching processed messages and managing idempotency on sidecar or SDK level or similar.

3. Idempotency window (how long to remember)?
   - [ ] 24 hours (standard)
   - [X] Configurable per service
   - [ ] Not specified

   **Your Decision**: Not for POC, but for future and by then Configurable might make most sense.

4. For events (asynchronous), is idempotency:
   - [X] Same as sync (key-based)
   - [ ] Event ID is idempotency key
   - [ ] Consumer responsibility

   **Your Decision**: To begin with we will keep it simple and make developer of SPAS service to ensure idempotency in the same way as for sync communication. See also additional notes

**Additional Notes**: SPAS SDK may optionally provide a base message which SPAS service contracts can derive from, which provides some sort of key or similar as part of metadata to allow consumer SPAS services to manage idempotency. Developer of SPAS services can then choose whether to use this or simply use the natural entity id to upsert data. Further, as written above,we might extend in future to handle this on sidecar level, by having sidecar caching processed messages keys and manage idempotency on the behalf of a service.

---

## 7. Additional Open Questions

### Q. Multi-Tenancy

**Question**: Should SPAS services support multi-tenancy?

**Scenarios**:

1. Single SPAS service instance serves multiple tenants (SaaS model)
2. One service instance per tenant (isolation model)

**Your Position**:

- [ ] Multi-tenancy required
- [ ] Multi-tenancy optional
- [X] Out of scope for v1.0

**If supported, how is tenant isolation achieved?**:

**Additional Notes**: Although not in scope for v1.0 we should consider Multi-tenancy as optional, where SPAS should support it by at least providing means of 1) propagating tenant id and 2) routing messages to appropriate infrastructure. At the same time we must answer the question where is the responsibility, 1) SPAS framework or 2) Domain context the implementation, and 3) should we force all SPAS services to support multi-tenancy which could make development of SPAS service more complex than needed in most cases. You are welcome to provide bit of idea.

---

### R. Serverless Deployment

**Current Statement**: "elaborate on this is achievable, since we want to be cloud agnostic"

**Question**: Should SPAS services be deployable to serverless platforms (AWS Lambda, Azure Functions)?

**Considerations**:

- Serverless has cold starts, state limitations
- Event-driven nature fits serverless well
- Container portability may not translate to FaaS

**Your Position**:

- [ ] Yes - services MUST support serverless
- [ ] Yes - services MAY support serverless (optional)
- [X] No - container-based only
- [ ] Defer to v2.0

**Additional Notes**:

---

### S. Signing & Package Security

**Current Note**: "elaborate on the need of this to begin with"

**Question**: Should SPAS packages be cryptographically signed?

**Options**:

- [X] **PoC**: No signing
  **Production**: Required signing (like Docker Content Trust)
  
- [ ] **Always Optional**: Up to organization policy
  
- [ ] **Required**: All packages must be signed

**If signing is required/optional**:

- Signing authority: _________________
- Key management: _________________
- Verification at: [ ] Repository [ ] Deployment [ ] Runtime

**Your Decision**:

**Additional Notes**:

---

### T. Observability Standards

**Question**: Which observability standards should SPAS mandate?

**Options** (check all that apply):

- [X] OpenTelemetry (traces, metrics, logs)
- [X] Prometheus metrics format
- [X] Structured logging (JSON)
- [X] Distributed tracing (W3C Trace Context)
- [X] Health check format (HTTP `/health`, `/ready`)
- [X] Service-specific (no mandate)

**Required Metrics** (check all):

- [X] Request rate
- [X] Error rate
- [X] Latency (p50, p95, p99)
- [X] Event publish/consume rates
- [X] Custom domain metrics

**Your Selections**: During the POC development we must address these again to make sure not to complicate things too much at the cost of speed.

**Additional Notes**:

---

## Summary & Next Steps

### Once You Complete This

1. **I will**:
   - Update `STRUCTURE.md` with your decisions
   - Create Architecture Decision Records (ADRs) for key choices
   - Begin migration with full clarity
   - No rework needed

2. **You will have**:
   - Clear, consistent specification
   - Documented rationale for decisions
   - Solid foundation for implementation

### How to Submit Your Answers

Just reply with your decisions inline in this document, or create a new document with your answers. Format doesn't matter—I'll extract the decisions.

---

**Ready?** Let me know if any questions need clarification before you answer!
