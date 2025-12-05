# Repository Specification

Defines the SPAS repository API and storage model.

## Responsibilities

- Store `spas.json`, schema artifacts, and (optionally) mapping metadata
- Index services by `id`, `version`, `capabilities`, `boundedContext` (retain optional `domainContext` for future domain composition discovery)
- Link to OCI images in external registries (store image digest for integrity)

## API Endpoints (baseline)

- `POST /services` — publish metadata (Name + Version in body, globally unique pair)
- `GET /services/{id}` — service details
- `GET /services/{id}/versions` — list versions
- `GET /services/{id}/versions/{version}` — merged spas.json + schema references
- `GET /services/{id}/versions/{version}/download` — download archive (spas.json + all schemas + mappings)
- `GET /services/{id}/versions/{version}/schemas` — list schemas
- `GET /services/{id}/versions/{version}/schemas/{schemaName}` — retrieve schema
- `GET /services?capability={cap}` — search by capability
- `GET /services?domainContext={domainContext}` — search by domain context (optional; future)
- `DELETE /services/{id}/versions/{version}` — unpublish

## Validation

- Schema validation of `spas.json`
- Duplicate detection (id + version)
- Image digest existence check (optional in PoC)
- (Production) Mapping artifact integrity hashes

## Auth & Policy

> PoC: No auth; local repo for speed
>
> Production: OIDC/RBAC; signed packages required; policy enforcement

## Storage Model

- PoC: File-based storage (research needed: filesystem strategy—DAPR component, volumes, or bare filesystem)
- Production: RDBMS/NoSQL metadata store
- Schema registry: Integrated (PoC) or external plugin (Production)
- OCI images: External registry (Docker Hub/ACR/ECR) — store digest in metadata
- Mapping artifacts: Optional; PoC defers, Production adds checksum enforcement

## Related Documents

- [Package Format](../infrastructure/15-package-format.md)
- [Schema Registry](../infrastructure/16-schema-registry.md)
- [Evolution Policy](../governance/25-evolution-policy.md)
