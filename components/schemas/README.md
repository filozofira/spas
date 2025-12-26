# SPAS Metadata Schemas

This directory contains the canonical JSON Schema definitions for SPAS **service metadata**.

## Schemas

| Schema | Purpose |
|--------|---------|
| [design-time-metadata-v1.schema.json](design-time-metadata-v1.schema.json) | Defines the structure of `spas.json` produced by SDKs at build/development time |
| [runtime-metadata-v1.schema.json](runtime-metadata-v1.schema.json) | Defines the structure of `spas.json` served by the Repository after runtime enrichment |

## Notes

- These files are intentionally shared across components (SDKs, Repository, CLI).
- Non-metadata schemas (e.g., sidecar config, choreography) remain owned by their respective components.
