# Decision Log (ADRs)

## Foundational

- ADR-001: gRPC over REST for service APIs (Production)
- ADR-002: Sidecar pattern for events and policy enforcement
- ADR-003: No service-to-service sync calls
- ADR-004: External container registry references
- ADR-005: Additive-only event evolution
- ADR-006: Zero-trust security model (Production)
- ADR-007: PoC vs Production markers in spec
- ADR-008: Single bounded context per service

## PoC-Specific (December 2025)

- ADR-009: HTTP-only transport in PoC; gRPC deferred to Production
- ADR-010: DAPR as PoC sidecar implementation
- ADR-011: Identity propagation via CloudEvents payload in PoC (middleware injection future)
- ADR-012: Custom DAPR HTTP Middleware for transformations (pending middleware execution order research)
- ADR-013: File-based repository storage in PoC; PostgreSQL document store target for Production
- ADR-014: Design-time metadata decomposition + Design-time endpoints for service introspection
- ADR-015: mTLS deferred; no SPIFFE/SVID in PoC
- ADR-016: Zipkin-only observability in PoC (Prometheus future)
- ADR-017: Contract testing deferred from PoC
- ADR-018: Direct DAPR pub/sub calls (CAP/outbox deferred to SDK Phase 2)
- ADR-019: Monorepo structure for PoC development (co-located SDK, CLI, Sidecar, and Examples)

## Related Documents

- [Evolution Policy](../governance/25-evolution-policy.md)
- [STRUCTURE Index](../STRUCTURE.md)
- [Glossary](27-glossary.md)
