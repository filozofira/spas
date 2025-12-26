# Introduction

SPAS (Self-contained, Portable, Adaptable Services) is a framework and specification that enables building services around a single bounded context that are reusable across domain contexts through choreography, not direct dependencies. SPAS emphasizes strong encapsulation, portable packaging, and configuration-driven adaptation.

> **⚠️ Proof of Concept**: SPAS is currently a PoC under active evaluation. APIs, schemas, and tooling may change significantly. Not recommended for production use. We welcome feedback — open an issue or start a discussion!

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

Most frameworks separate infrastructure (mesh/sidecar), semantics (API specs), and AI tooling into distinct concerns. SPAS unifies these: services self-describe in a way that AI agents can read, understand intent, and choreograph — with the runtime (sidecar) already wired for execution.

## Architecture Overview

Detailed architecture documentation lives in the Principles docs.

- Canonical architecture description: [principles/02-architecture-overview.md](principles/02-architecture-overview.md)
- Sidecar behavior/contract (normative): [principles/component/10-sidecar-contract.md](principles/component/10-sidecar-contract.md)
- Domain choreography model: [principles/component/14-domain-choreography.md](principles/component/14-domain-choreography.md)
- End-to-end composition workflow (canonical): [components/cli/spas-compose/README.md](components/cli/spas-compose/README.md)

## Using SPAS

SPAS has two primary workflows: (1) build a self-describing service, then (2) compose services into a runnable domain using choreography.

### 1) Develop a SPAS service

A SPAS service is a single bounded-context service that exposes commands/queries and emits events, and can generate an offline metadata archive (`service.metadata.zip`) describing its contracts and schemas.

High-level flow:

1. Implement the service (commands/queries/events + sidecar integration)
2. Generate design-time metadata (offline archive)
3. Publish the metadata archive to a Repository

AI-assisted option: use the `/spas.service` agent workflow — see [AI-Assisted Development](#ai-assisted-development).

Start here:

- Service workspace + publishing: [spas-service CLI](./components/cli/spas-service/README.md)
- SDKs: [.NET SDK](./components/sdk/dotnet/README.md) | [Java SDK](./components/sdk/java/README.md)
- Runnable service examples: [Examples Services](./examples/services/README.md)

### 2) Compose a domain

A domain composition pulls multiple service metadata archives and defines choreography (plus transformations) to generate runnable artifacts like `docker-compose.yaml`.

High-level flow:

1. Initialize a domain workspace (`choreography.yaml`, `services/`, `transformations/`)
2. Pull the services you want to compose (from Repository)
3. Author choreography + transformations
4. Build runnable artifacts and start the domain

AI-assisted option: use the `/spas.compose` agent workflow — see [AI-Assisted Development](#ai-assisted-development).

Start here:

- Domain workspace + build: [spas-compose CLI](./components/cli/spas-compose/README.md)
- Choreography model: [Domain choreography model](./principles/component/14-domain-choreography.md)
- Runnable domain examples: [Examples Domains](./examples/domains/README.md)

### AI-Assisted Development

SPAS includes GitHub Copilot agent prompts for AI-assisted workflows:

- `/spas.service` — Guided service scaffolding and validation
- `/spas.compose` — Guided choreography authoring (always include `DOMAIN:<name>`)

See [.github/agents/README.md](.github/agents/README.md) for usage and available agents.

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

## Scope

### In Scope

- What makes a service SPAS-compliant
- Protocols for sync (north-south) and async (east-west) communication
- Adaptation rules for choreography via `choreography.yaml`
- Packaging and repository integration
- Security, observability, and governance requirements

### Out of Scope (v1.0)

- Central orchestration (choreography-only)
- Control plane requirements (PoC avoids managed control plane)
- Serverless execution (container-only)
- Path parameters in command endpoints (e.g., `/order/{id}/confirm` not supported; use flat endpoints like `/confirm-order`)
- Input/output transformations for queries and commands (transformations apply to events only)
- Queries in choreography (queries are synchronous; route via API Gateway, not event flows)

> PoC vs Production: See [principles/02-architecture-overview.md](principles/02-architecture-overview.md) for the canonical comparison.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on bug reports, feature requests, and code contributions.
