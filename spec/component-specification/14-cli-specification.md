# CLI Specification

Defines the command-line tools that power the SPAS developer workflow.

## Commands

### PoC Core (spas-service)

- `spas-service init [--template <name>]` — Initialize a new service
- `spas-service build` — Build the service
- `spas-service metadata get [--url <service-url>] [--output <dir>]` — Fetch design-time metadata from service /_spas/metadata endpoint and decompose to folder structure
- `spas-service pack` — Create SPAS archive (metadata + schemas + mappings)
- `spas-service publish [--repo <url>]` — Publish archive to repository
- `spas-service pull <name> <version> [--repo <url>] [--output <dir>]` — Download service from repository

### PoC Core (spas-compose)

- `spas-compose context init <domain-name>` — Create domain folder with docker-compose.yaml scaffold
- `spas-compose services pull <name> <version> [--repo <url>]` — Download services, decompose to /services folder
- `spas-compose choreography init <flow-name>` — Create choreography.yaml template
- `spas-compose choreography generate` — Generate DAPR components, transformations, update docker-compose

### Deferred (PoC)

- `spas-service validate` — Validate service compliance (defer PoC; add if simple)

### Future Candidates

- `spas-service test` — Run contract tests (Pact-style)
- `spas-compose validate` — Validate choreography + transformations
- `spas-compose diff` — Compare choreography versions
- `spas-compose replay <events-file>` — Event replay for local testing
- Transformation auto-scaffolding (DSL or generator)

## Configuration

- Global config at `~/.spas/config.yaml`
- Supports multiple repositories and registries

## Extension Model

- Plugin architecture with discoverable commands (future); PoC may rely on static core set

## Related Documents

- [Transformation Middleware](11-transformation-middleware.md)
- [Repository Specification](12-repository-spec.md)
- [Service Metadata](../service-specification/06-service-metadata.md)
