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
- ADR-013: File-based repository storage in PoC; PostgreSQL document store target for Production
- ADR-014: Design-time metadata decomposition + Design-time endpoints for service introspection
- ADR-015: mTLS deferred; no SPIFFE/SVID in PoC
- ADR-016: Zipkin-only observability in PoC (Prometheus future)
- ADR-017: Contract testing deferred from PoC
- ~~ADR-018: Direct DAPR pub/sub calls~~ **DROPPED** (Dec 2025): DAPR evaluation found HTTP middleware incompatible with pub/sub. Using SPAS sidecar with Redis pub/sub instead. CAP/outbox pattern deferred to SDK Phase 2.
- ADR-019: Monorepo structure for PoC development (co-located SDK, CLI, Sidecar, and Examples)
- ADR-020: Sidecar-mediated service invocation for command/query patterns (Dec 2025): Sidecars can invoke services directly via configured HTTP endpoints (PoC) or gRPC methods (Production) for command and query handling, in addition to event-driven flows. Invocation rules configured in `choreography.yaml`. Maintains principle of no direct service-to-service communication (all traffic mediated by sidecars). Enables request-response patterns while preserving sidecar responsibilities for transformation, observability, and policy enforcement.

## Related Documents

- [Evolution Policy](../governance/25-evolution-policy.md)
- [INDEX](../INDEX.md)
- [Glossary](27-glossary.md)
