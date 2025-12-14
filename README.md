# Introduction

SPAS (Self-contained, Portable, Adaptable Services) is a framework and specification that enables building services around a single bounded context that are reusable across domain contexts through choreography, not direct dependencies. SPAS emphasizes strong encapsulation, portable packaging, and configuration-driven adaptation.

## Why SPAS

- Fragmented microservice practices create distributed monoliths; SPAS enforces strict boundaries and event-first integration.
- Portability across OS/cloud/container platforms requires minimal runtime assumptions; SPAS services package everything needed to run.
- Reuse across domains demands decoupling from domain specifics; SPAS uses adaptation/choreography to bind services into different Domain Contexts without code changes.

## Design Goals

- Self-contained: No synchronous cross-context dependencies
- Portable: OS/cloud/container agnostic
- Adaptable: Join different Domain Contexts via configuration
- Observable: First-class telemetry and health
- Secure-by-default: Zero-trust communication
- Versionable: Contracts evolve safely over time

## Relationship to Existing Paradigms

- Domain-Driven Design (DDD): 1 bounded context → 1 SPAS service
- Microservices: Smaller and stricter; no runtime service dependencies
- Event-driven architecture (EDA): East–West communication is event-first
- Service mesh/Sidecar: Offloads networking, security, and reliability concerns
- API Gateway: North–South traffic terminates at the edge; TLS termination, authentication, routing (Production: REST→gRPC translation)

## Scope

SPAS specifies:

- What makes a service SPAS-compliant
- Protocols for sync (north-south) and async (east-west) communication
- Adaptation rules for choreography via `choreography.yaml`
- Packaging and repository integration
- Security, observability, and governance requirements

## Current Status

### PoC Phase (December 2025)

- ✅ **SPAS Sidecar Component**: Custom sidecar prototype complete

  - Service invocation: Command/query patterns via HTTP endpoints
  - Event-driven flows: Redis pub/sub with event consumption
  - Message transformation with CloudEvents 1.0 wrapper
  - W3C Trace Context propagation
  - Zipkin distributed tracing with correlated parent-child span relationships
  - Request-response and fire-and-forget patterns
  - Configuration-driven routing and transformation
  - See: `prototypes/spas-sidecar-prototype/`

- ✅ **.NET SDK**: Production-ready implementation complete (2025-12-13)
  - Initial PoC (001-dotnet-spas-sdk): Metadata composition, event publishing, observability
  - Schema Alignment (002-metadata-schema-alignment): Design-time metadata aligned with spec
  - 60 unit tests passing, JsonSchema.Net validation
  - Builder APIs: ServiceIdentity, Contracts, Security, Consistency, Network
  - Schema location: `components/sdk/schemas/design-time-metadata-v1.schema.json`
  - See: `components/sdk/dotnet/README.md` and `specs/002-metadata-schema-alignment/COMPLETION.md`

## Out of Scope (v1.0)

- Central orchestration (choreography-only)
- Control plane requirements (PoC avoids managed control plane)
- Serverless execution (container-only)

> PoC vs Production
>
> - PoC: Local repository, no auth; metadata-only policy declarations
> - Production: AuthN/AuthZ, signed packages, enforceable policies

## Related Documents

- [Principles](./principles/README.md) - SPAS Framework guiding principles
- [Specs](./specs/README.md) - GitHub SpecKit files
- [Components](./components/README.md) - SPAS Framework component development
- Prototypes
  - [spas-sidecar](./prototypes/spas-sidecar-prototype/README.md) - SPAS Sidecar prototype
