# Architecture Overview

This document provides a high-level view of SPAS components and how they interact.

## Components

- SPAS Services: Packaged bounded contexts exposing gRPC APIs and events
- Sidecar/Mesh: Platform-injected proxy handling networking, security, and event I/O
- API Gateway (external): Edge REST→gRPC, auth, routing, TLS termination
- SPAS Repository: Stores metadata (spas.json) and links to container images
- Schema Registry (integrated, PoC): Stores event/message schemas
- SDKs & CLI: Language/tooling to build, validate, and compose services

## Communication Model

- North–South (client ↔ service)
  - gRPC primary; REST only at API gateway
  - Edge handles auth, versioning, rate control (team’s choice of gateway)
- East–West (service ↔ service)
  - Event-first via sidecar/mesh
  - Identity propagation and correlation metadata
  - No direct service-to-service sync calls

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
  - Schemas — stored in repo-integrated schema registry (PoC)

## Security Model (High Level)

- Edge: OIDC/JWT validation; TLS termination
- Mesh/Sidecar: mTLS, policy enforcement, identity propagation
- Enclosure levels: strict | moderate | open (PoC: declarative only)
- Data classification: declared in metadata (enforceable in production)

## Execution Environments

- Kubernetes (primary target)
- Docker Compose (local development)
- Bare metal (future)

> PoC vs Production
>
> - PoC: Dapr or mesh-compatible sidecar recommended for speed
> - Production: Mesh-agnostic sidecar contract (Istio/Linkerd/Dapr compatible)

## Related Documents

- [STRUCTURE Index](STRUCTURE.md)
- [Communication Model](protocol-specification/07-communication-model.md)
- [Adaptation Protocol](protocol-specification/10-adaptation-protocol.md)
- [Runtime Environment](infrastructure/15-runtime-environment.md)
