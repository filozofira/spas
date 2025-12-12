# Package Format

Defines the SPAS package and its distribution artifacts.

## Artifacts

- OCI container image (runtime)
- Metadata (`spas.json`) — stored in SPAS repository
- Schemas (internal) — stored in integrated registry (PoC)

## Package Structure

Minimal opinionation for service source layout. Required artifacts for distribution:

```text
my-service-v1.0.0/
├── spas.json
├── schemas/                # Internal & event schemas
├── mappings/               # Transformation mapping files (optional if no adaptation)
├── docs/                   # Optional human-readable docs
└── runtime-ref.txt         # Optional build metadata
```

Domain Composition artifacts (choreography + mappings) MAY live in a separate domain repository (recommended) to decouple service evolution from domain wiring.

## Image Requirements

- Non-root, minimal base, health endpoints
- Configuration via env vars and files (12-factor)
- Observability hooks (OTel exporters)

## Integrity & Signing

- PoC: Signing optional
- Production: Signing required (Sigstore/cosign or equivalent); provenance (SLSA level target) encouraged

## Compatibility

- Semantic versioning enforced
- Backward-compatible (additive) schema and API changes preferred
- Mapping versioning tied to choreography release to enable rollback

## Related Documents

- [Service Lifecycle](../service-specification/05-service-lifecycle.md)
- [Repository Specification](../component-specification/11-repository-spec.md)
- [Versioning Strategy](../governance/23-versioning-strategy.md)
