# Repository Specification

Defines the SPAS repository API and storage model.

## Responsibilities

- Store `spas.json`, schema artifacts, and (optionally) mapping metadata
- Index services by `id`, `version`, `capabilities`, `boundedContext` (retain optional `domainContext` for future domain composition discovery)
- Link to OCI images in external registries (store image digest for integrity)

## API Endpoints (baseline)

- `POST /services` — publish metadata
- `GET /services/{id}` — service details
- `GET /services/{id}/versions` — list versions
- `GET /services/{id}/versions/{version}` — version details
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

- Metadata store (RDBMS/NoSQL)
- Schema registry integrated (PoC) or external plugin (Production)
- OCI images in external registry (Docker Hub/ACR/ECR) — store digest in metadata
- Mapping artifact storage (optional) with checksum for enforcement

## Related Documents

- [Package Format](12-package-format.md)
- [Schema Registry](14-schema-registry.md)
- [Evolution Policy](../governance/25-evolution-policy.md)
