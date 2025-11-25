# CLI Specification

Defines the command-line tools that power the SPAS developer workflow.

## Commands

- `spas init [--template <name>]` — Initialize a new service
- `spas validate` — Validate service compliance and metadata
- `spas build` — Build the service
- `spas pack` — Create SPAS package artifact
- `spas push [--repo <url>]` — Publish to repository
- `spas pull <service-id> [--version <ver>]` — Download service
- `spas run [--local]` — Run service locally (with sidecar)
- `spas compose` — Create/update `choreography.yaml`
- `spas bind <config-file>` — Apply choreography binding
- `spas schema validate <file>` — Validate schema
- `spas schema publish <file>` — Publish schema to registry

## Configuration

- Global config at `~/.spas/config.yaml`
- Supports multiple repositories and registries

## Extension Model

- Plugin architecture with discoverable commands

## Related Documents

- [Adaptation Protocol](../protocol-specification/10-adaptation-protocol.md)
- [Repository Specification](../infrastructure/13-repository-spec.md)
- [Service Metadata](../service-specification/06-service-metadata.md)
