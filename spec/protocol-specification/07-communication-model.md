# Communication Model

Defines North–South and East–West communication patterns and responsibilities.

## North–South (Edge)

- gRPC-first; REST supported only at API Gateway (external infra)
- Gateway responsibilities: REST→gRPC translation, auth (OIDC/JWT), versioning, routing, TLS termination
- Clients MUST set deadlines; services MUST honor

## East–West (Service ↔ Service)

- Event-first via sidecar/mesh
- Identity propagation (JWT claims or SPIFFE/SPIRE identities) in headers/metadata
- No direct sync calls between services

## Sidecar Responsibilities

- Protocol translation (gRPC ↔ Events)
- Schema validation (PoC: optional; Production: required)
- Publishing/subscription with idempotent delivery semantics
- Observability: traces/metrics/logs

## Protocol Selection

- Prefer events for cross-context communication
- Use gRPC for edge calls and intra-service module boundaries only
