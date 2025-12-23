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

### 1) Develop a SPAS service

1. Pick an SDK and follow its component README:

- [.NET SDK](./components/sdk/dotnet/README.md)
- [Java SDK](./components/sdk/java/README.md)

2. Run an example service (recommended for first-time setup):

- [Examples Services](./examples/services/README.md)

3. Publish service metadata to a Repository:

- [spas-service CLI](./components/cli/spas-service/README.md)

### 2) Compose a domain

1. Initialize a domain workspace:

- [spas-compose init](./components/cli/spas-compose/README.md)

2. Pull the services you want to compose:

- [spas-compose services pull](./components/cli/spas-compose/README.md)

3. Author `choreography.yaml` and any JSONata files under `transformations/`:

- [Domain choreography model (principles)](./principles/component/14-domain-choreography.md)

4. Build runnable artifacts and start the domain:

- [spas-compose choreography build](./components/cli/spas-compose/README.md)
- `docker compose up`

See the runnable domain examples for concrete compositions:

- [Examples Domains](./examples/domains/)

## AI-Assisted Development

SPAS includes GitHub Copilot agent prompts for AI-assisted workflows:

- **`/spas.compose`** — Domain choreography authoring with AI guidance
- **SpecKit agents** — Structured specification, planning, and implementation

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
