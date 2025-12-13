# Communication Model

Defines North–South and East–West communication patterns and responsibilities.

## North–South (Edge)

- PoC: HTTP (JSON over HTTP; SPAS sidecar invokes services via HTTP, TLS termination, auth, routing)
- Production: gRPC-first; REST only at API Gateway with REST→gRPC translation (TLS termination, auth, routing)
- Gateway responsibilities: REST→HTTP/gRPC translation, auth (OIDC/JWT), versioning, routing, TLS termination
- Clients MUST set deadlines; services MUST honor

## East–West (Service ↔ Service)

- Event-first via sidecar/mesh (CloudEvents JSON)
- Sidecar-mediated invocation:
  - Sidecars can invoke services directly via configured endpoints for command/query patterns
  - Invocation rules defined in `choreography.yaml` (endpoints, transformations, routing)
  - Maintains sidecar responsibilities: transformation, observability, policy enforcement
  - PoC: HTTP; Production: gRPC
- Identity propagation:
  - PoC: JWT token in CloudEvents payload; SDK helper extracts claims
  - Production: Sidecar injects auth headers from event claims
- No direct service-to-service communication (all traffic flows through sidecars)

## Sidecar Responsibilities

- Protocol translation: PoC HTTP ↔ Events; Production gRPC ↔ Events
- Schema validation (PoC: optional; Production: required)
- Publishing/subscription with at-least-once delivery semantics and idempotent processing semantics
- Observability: traces/metrics/logs

## Protocol Selection

- Prefer events for cross-context communication
- PoC: HTTP for edge calls and sidecar→service invocation
- Production: gRPC for edge calls (via gateway) and intra-service module boundaries

## Related Documents

- [gRPC Protocol](08-grpc-protocol.md)
- [Event Protocol](09-event-protocol.md)
- [Sidecar Contract](../component/10-sidecar-contract.md)
