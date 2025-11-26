# CLI Specification

Defines the command-line tools that power the SPAS developer workflow.

## Commands

### PoC Core

- `spas init [--template <name>]` — Initialize a new service
- `spas validate` — Validate service compliance and metadata
- `spas build` — Build the service
- `spas pack` — Create SPAS package artifact
- `spas push [--repo <url>]` — Publish to repository
- `spas pull <service-id> [--version <ver>]` — Download service
- `spas compose` — Create/update `choreography.yaml`
- `spas schema validate <file>` — Validate JSON schema
- `spas schema publish <file>` — Publish schema to registry

### Local Convenience

- `spas run [--local]` — Run service locally (with sidecar)
- `spas bind <choreography.yaml>` — Apply local composition for simulation

### Future Candidates

- `spas mapping test <mapping-file>` — Validate transformation rules
- `spas diff <service-id> <from> <to>` — Compare metadata/contracts
- `spas replay <events-file>` — Event replay for regression
- `spas coverage` — Contract/test coverage summary
- `spas generate mappings` — Scaffold mapping templates

## Configuration

- Global config at `~/.spas/config.yaml`
- Supports multiple repositories and registries

## Extension Model

- Plugin architecture with discoverable commands (future); PoC may rely on static core set

## Related Documents

- [Adaptation Protocol](../protocol-specification/10-adaptation-protocol.md)
- [Repository Specification](../infrastructure/13-repository-spec.md)
- [Service Metadata](../service-specification/06-service-metadata.md)
