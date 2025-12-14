# SPAS Components

The SPAS Framework is composed of modular, independently deployable components that work together to enable autonomous service architectures. Each component has a specific responsibility and communicates through well-defined contracts.

## Components

| Component | Description |
|-----------|-------------|
| **CLI** | Command-line tools for service publishing and orchestration |
| **SDK** | Language-specific libraries for building SPAS-enabled services |
| **Repository** | Central registry for service metadata discovery and validation |

## CLI Tools

- [spas-service](./cli/spas-service/README.md) — Publish and pull service metadata to/from the Repository
- [spas-compose](./cli/spas-compose/README.md) — Orchestrate multi-service deployments with AI-assisted composition

## SDKs

- [.NET SDK](./sdk/dotnet/README.md) — Attribute-based metadata discovery for ASP.NET Core services
- [Schemas](./sdk/schemas/README.md) — Canonical JSON Schema definitions shared across SDK implementations

## Infrastructure

- [Repository](./repository/README.md) — REST API for storing, validating, and serving service metadata

## Architecture

```
┌─────────────┐      ┌─────────────┐     ┌─────────────┐
│   SDK       │────▶│   CLI       │────▶│ Repository  │
│ (metadata)  │      │ (publish)   │     │ (registry)  │
└─────────────┘      └─────────────┘     └─────────────┘
```

Services use SDKs to expose metadata → CLI tools package and publish → Repository stores and serves.
