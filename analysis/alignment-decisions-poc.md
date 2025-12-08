# PoC Alignment Decisions

Document capturing decisions and action items from the structured alignment dialogue (December 2025).

## Decided & Locked

### Sidecar/Mesh (DAPR)

- **Middleware placement:** Transform both inbound + outbound via SDK wrapper for event publishing
- **Identity propagation:** Identity in payload (Option 2) for PoC simplicity. Middleware injection deferred to Production.
- **Transport:** HTTP only in PoC; gRPC deferred (documented in spec as future)
- **Auth header format:** Deferred to Production (Authorization: Bearer JWT)

### Identity & Security

- **mTLS:** Skip PoC; document as future enhancement in spec
- **Declarative security:** Yes, enforcement deferred
- **Repository persistence:** Assume PostgreSQL document store; final decision deferred to implementation phase

### SPAS Service

- **Metadata endpoints:** Service exposes merged `spas.json` + schemas; alternative archive packaging (if complex)
- **State management:** Developer choice (DAPR or direct); SDK enforces unified configuration
- **Outbox:** Call DAPR publish API directly in PoC (CAP documented as future SDK enhancement)

### SDK

- **gRPC support:** Deferred; HTTP-only in PoC (documented as future)
- **Config helpers:** Research needed on DAPR Secrets/Config components for unified configuration enforcement
- **PII endpoints:** Future only

### Repository

- **Archive format:** zip (research needed on final choice)
- **Storage:** File-based in PoC (research needed on filesystem strategy: DAPR component, volumes, etc.)
- **Keying:** Uniqueness on `serviceName + version` (globally unique pair)
- **Pull versioning:** Explicit version required (no "latest" default)

### CLI (spas-service / spas-compose)

- **spas-service validate:** Skip PoC; add later if needed
- **Metadata retrieval:** New command `spas-service metadata get` to fetch and decompose from service endpoints
- **docker-compose.yaml updates:** Only via `choreography generate`
- **Transformation templates:** Manual authoring in PoC; auto-scaffolding deferred
- **spas-compose run:** Skip PoC; developer uses docker CLI directly

### Domain Composition

- **Choreography structure:** Start with single top-level `choreography.yaml` per domain; flexible to change if maintenance difficult
- **Transformation files:** Single file per service with multiple rules (flexible to per-event if maintenance warrants)
- **Domain schemas:** Version & store locally in domain repo only
- **Cross-domain reuse:** Each domain isolates its mappings (no shared transformation storage)
- **Service reuse:** Yes, multiple domains can compose same service version with different choreographies

### Observability & Testing

- **Observability:** Zipkin only in PoC
- **Testing:** Contract testing deferred; documented in spec as future

### PoC Success Criteria

- **Minimum goal:** One end-to-end flow running under docker-compose with DAPR + transformations (flows TBD)

---

## Action Items (Requires Further Research/Decision)

| # | Topic | Description | Owner | Status |
|---|-------|-------------|-------|--------|
| 1 | DAPR HTTP Middleware | ⚠️  **VALIDATION CONFIRMED (DAPR 1.16)**: Attempted real DAPR integration with sidecar + Redis pub/sub. Critical Finding CONFIRMED ACROSS VERSIONS: DAPR's built-in HTTP middleware type (`middleware.http.transformation`) is NOT a registered component type in daprd 1.16.3. Same error: "HTTP middleware middleware.http.transformation/v1 has not been registered". **Confirmed Solution:** **Sidecar Adapter Pattern** - custom middleware container (Go, validated working) sits between DAPR and service. No architecture change needed, only deployment config change. Prototype in `prototypes/dapr-middleware/` demonstrates working approach. | TBD | LOCKED - SIDECAR ADAPTER PATTERN |
| 2 | Metadata endpoints | Decide: merged spas.json/schemas in single call vs. archive packaging vs. individual fragments. Test complexity of each. | TBD | TODO |
| 3 | DAPR Config/Secrets | Research DAPR Secrets & Configuration components; assess if SDK can wrap them for unified SPAS service configuration. | TBD | TODO |
| 4 | Archive format & tools | Evaluate zip vs tar.gz + tool support (C#/.NET ecosystem preference). | TBD | TODO |
| 5 | Repository persistence | Finalize file-based strategy (DAPR component vs. volumes vs. bare filesystem). Revisit PostgreSQL vs. other document stores if needed. | TBD | TODO |
| 6 | Transformation authoring | Once initial PoC runs, assess manual YAML maintainability and consider auto-scaffolding or DSL. | TBD | TODO |

---

## Deferred Features (Documented in Spec as Future)

- gRPC support (HTTP-only PoC)
- mTLS (zero-trust later)
- Outbox pattern / CAP library (direct DAPR publish in PoC)
- PII endpoints
- Contract testing (Pact-style)
- Prometheus metrics
- Policy enforcement (OPA or similar)
- Transformation auto-scaffolding

---

## Spec Documentation Updates Needed

- [ ] Clarify HTTP-only transport in PoC section (gRPC roadmap mentioned)
- [x] Document identity propagation approach (Payload-based for PoC)
- [ ] Add DAPR middleware research caveat
- [ ] Record metadata endpoint design decision
- [ ] Add action items section to spec or separate ADR (Architecture Decision Record)
