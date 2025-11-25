# Package Format

Defines the SPAS package and its distribution artifacts.

## Artifacts

- OCI container image (runtime)
- Metadata (`spas.json`) — stored in SPAS repository
- Schemas (internal) — stored in integrated registry (PoC)

## Package Structure

```text
my-service-v1.0.0/
├── spas.json
├── schemas/
├── docs/
└── runtime-ref.txt
```

## Image Requirements

- Non-root, minimal base, health endpoints
- Configuration via env vars and files (12-factor)
- Observability hooks (OTel exporters)

## Integrity & Signing

- PoC: Signing optional
- Production: Signing required (Sigstore/cosign or equivalent)

## Compatibility

- Semantic versioning enforced
- Backward-compatible schema and API changes preferred
