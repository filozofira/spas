# CLI Specification

Defines the command-line tools that power the SPAS developer workflow.

## Commands

### PoC Core (spas-service)

- `spas-service init [--template <name>]` — Initialize a new service
- `spas-service metadata get [--url <service-url>] [--output <dir>]` — Fetch design-time metadata from service /_spas/metadata endpoint and decompose to folder structure
- `spas-service pack` — Create SPAS archive (metadata + schemas + mappings)
- `spas-service publish [--repo <url>]` — Publish archive to repository
- `spas-service pull <name> <version> [--repo <url>] [--output <dir>]` — Download service from repository

### PoC Core (spas-compose)

- `spas-compose init <domain-name>` — Create domain folder with scaffolded structure, empty `choreography.yaml`, README with workflow instructions, and agent prompt reference
- `spas-compose services pull <name> <version> [--repo <url>]` — Download service metadata and schemas to `services/<name>/` folder
- `spas-compose choreography deploy --docker [--dry-run]` — Validate choreography and generate `docker-compose.yaml` with sidecar configurations. `--dry-run` validates without generating.

> **AI-in-the-Loop Composition**: After pulling services, developers use the `/spas.compose` agent prompt to analyze contracts and propose choreography. The agent iteratively updates `choreography.yaml` and generates `.jsonata` transformation files based on developer feedback. See `.github/agents/spas-compose.md`.

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

### Cross‑Component Boundaries (See Constitution)

- Responsibilities: Deterministically compose canonical `spas.json`, package artifacts, and publish metadata/schemas to the Repository (Constitution → CLI Tools → Responsibilities & Boundaries).
- Dev Integration: MAY call a service’s dev‑only `/_spas/metadata` endpoint to fetch an aggregated view for local workflows; MUST NOT rely on it in production.
- Source of Truth: CLI orchestrates but does not persist runtime metadata. After publish, the Repository is the source of truth.

## Extension Model

- Plugin architecture with discoverable commands (future); PoC may rely on static core set

## Related Documents

- [Transformation Middleware](11-transformation-middleware.md)
- [Repository Specification](11-repository.md)
- [Service Metadata](../service/06-service-metadata.md)
