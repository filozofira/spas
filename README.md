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

## Architecture Overview

This repo keeps the detailed architecture description in the Principles docs.

- Canonical architecture description: [principles/02-architecture-overview.md](principles/02-architecture-overview.md)
- Sidecar behavior/contract (normative): [principles/component/10-sidecar-contract.md](principles/component/10-sidecar-contract.md)
- Domain choreography model: [principles/component/14-domain-choreography.md](principles/component/14-domain-choreography.md)
- End-to-end composition workflow (canonical): [components/cli/spas-compose/README.md](components/cli/spas-compose/README.md)

## Scope

SPAS specifies:

- What makes a service SPAS-compliant
- Protocols for sync (north-south) and async (east-west) communication
- Adaptation rules for choreography via `choreography.yaml`
- Packaging and repository integration
- Security, observability, and governance requirements

## Out of Scope (v1.0)

- Central orchestration (choreography-only)
- Control plane requirements (PoC avoids managed control plane)
- Serverless execution (container-only)
- Path parameters in command endpoints (e.g., `/order/{id}/confirm` not supported; use flat endpoints like `/confirm-order`)
- Input/output transformations for queries and commands (transformations apply to events only)
- Queries in choreography (queries are synchronous; route via API Gateway, not event flows)

> PoC vs Production
>
> See [principles/02-architecture-overview.md](principles/02-architecture-overview.md) for the canonical PoC vs Production comparison.

## Common Documentation

- [Principles](./principles/README.md) - Framework principles, architecture overview, protocol specifications, and governance
  - [Core Principles](./principles/01-core-principles.md) - Foundation design goals
  - [Architecture Overview](./principles/02-architecture-overview.md) - System structure and patterns
  - [Communication Model](./principles/protocol/07-communication-model.md) - North-south and east-west patterns
  - [Security Model](./principles/security/19-security-model.md) - Zero-trust architecture
  - [Versioning Strategy](./principles/governance/23-versioning-strategy.md) - Contract evolution
- [Specs](./specs/README.md) - Component specifications and implementation guides
- [Examples](./examples/README.md) - Sample services and domain implementations
- [Grooming](./GROOMING.md) - Product backlog and feature planning

## Component Documentation

### SDKs
Build SPAS-compliant services in your preferred language:

- [SDK Overview](./components/sdk/README.md) - Language SDK comparison and guidance
- [.NET SDK](./components/sdk/dotnet/README.md) - C# implementation with ASP.NET Core
- [Java SDK](./components/sdk/java/README.md) - Java implementation (framework-agnostic)
- [SDK Conventions](./components/sdk/CONVENTIONS.md) - Shared rules across all SDKs

### CLI Tools
Manage service lifecycle and compose domain contexts:

- [CLI Overview](./components/cli/README.md) - Tool comparison and workflows
- [spas-service](./components/cli/spas-service/README.md) - Publish and pull service packages
- [spas-compose](./components/cli/spas-compose/README.md) - Generate choreography and deployment configs

### Runtime Components
Core infrastructure services:

- [Repository](./components/repository/README.md) - Service metadata and package registry
- [Sidecar](./components/sidecar/README.md) - Event routing, telemetry, and health checks

## Contributing

SPAS is an internal framework under active development. Component-specific contribution guides are available:

- **SDK Contributors**: See language-specific CONTRIBUTING.md files in [components/sdk/dotnet](./components/sdk/dotnet/CONTRIBUTING.md) and [components/sdk/java](./components/sdk/java/CONTRIBUTING.md)
- **CLI Contributors**: See [spas-service](./components/cli/spas-service/CONTRIBUTING.md) and [spas-compose](./components/cli/spas-compose/CONTRIBUTING.md) contributor guides
- **Repository/Sidecar Contributors**: Development workflows documented in respective component READMEs

For architectural proposals or governance changes, review the [Principles](./principles/README.md) and [Decision Log](./principles/appendix/28-decision-log.md).
