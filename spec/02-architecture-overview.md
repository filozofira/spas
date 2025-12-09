# Architecture Overview

This document provides a high-level view of SPAS components and how they interact.

## Components

- SPAS Services: Packaged bounded contexts exposing APIs and events
- Sidecar/Mesh: Platform-injected proxy handling networking, security, transformation, and event I/O
- API Gateway (external): Edge REST→HTTP/gRPC, auth, routing, TLS termination
- SPAS Repository: Stores metadata (spas.json) and SPAS Service event/message schemas. It does not store transformation configs.
- SDKs & CLI: Language/tooling to build, validate, and compose services

## Communication Model

- North–South (client ↔ service)
  - PoC: HTTP (sidecar ↔ service); gRPC planned for future
  - Edge: REST→HTTP translation, auth (OIDC/JWT), routing, TLS termination
- East–West (service ↔ service)
  - Event-first via sidecar/mesh (CloudEvents JSON)
  - Sidecar-mediated invocation: Sidecars can invoke services directly for command/query patterns (configured in `choreography.yaml`)
  - Identity propagation (PoC: in payload; Future: middleware injection)
  - No direct service-to-service communication (all traffic flows through sidecars)

## Choreography & Adaptation

- Domain Composition described by `choreography.yaml`:
  - Services (id + version)
  - Event routing rules (topics)
  - Transformation mappings (domain ↔ internal)
  - Service configuration overrides
  - Network policies (informative in PoC)
- Adaptation is performed at the sidecar/mesh layer

## Packaging & Distribution

- Service artifacts:
  - Container image (OCI) — published to standard registries
  - Metadata (`spas.json`) — published to SPAS repository
  - Schemas — stored in SPAS repo-integrated schema registry (PoC)

## Security Model (High Level)

- Edge: OIDC/JWT validation; TLS termination
- Mesh/Sidecar: mTLS, policy enforcement, identity propagation
- Enclosure levels: strict | moderate | open (PoC: declarative only)
- Data classification: declared in metadata (PoC: declarative only, but should be enforceable in production in future)

## Execution Environments

- Kubernetes (primary target)
- Docker Compose (local development)
- Bare metal (future)

> PoC vs Production
>
> - PoC: SPAS sidecar component; HTTP transport; no mTLS; Zipkin observability; CloudEvents wrapper for transformations
> - Production: Mesh-agnostic sidecar contract (Istio/Linkerd compatible); gRPC transport; mTLS; policy enforcement

## Related Documents

- [STRUCTURE Index](STRUCTURE.md)
- [Communication Model](protocol-specification/07-communication-model.md)
- [Transformation Middleware](component-specification/11-transformation-middleware.md)
- [Runtime Environment](infrastructure/17-runtime-environment.md)
