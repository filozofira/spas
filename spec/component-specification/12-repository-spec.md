# Repository Specification

Defines the SPAS repository API and storage model.

## Responsibilities

- Store `spas.json` and schema artifacts for services
- Index services by `serviceName`, `version`, `capabilities`, `boundedContext` (retain optional `domainContext` for future discovery)
- Link to OCI images in external registries (store image digest for integrity)

## API Endpoints (baseline)

Natural key aligns with CLI (`spas-service pull <name> <version>`):

- `POST /services` — publish metadata (serviceName + version in body, globally unique pair)
- `GET /services/{serviceName}` — service details
- `GET /services/{serviceName}/versions` — list versions
- `GET /services/{serviceName}/versions/{version}` — merged spas.json + schema references
- `GET /services/{serviceName}/versions/{version}/download` — download archive (spas.json + all schemas)
- `GET /services/{serviceName}/versions/{version}/schemas` — list schemas
- `GET /services/{serviceName}/versions/{version}/schemas/{schemaName}` — retrieve schema
- `GET /services?capability={cap}` — search by capability
- `GET /services?domainContext={domainContext}` — search by domain context (optional; future)
- `DELETE /services/{serviceName}/versions/{version}` — unpublish

## Validation

- Schema validation of `spas.json`
- Duplicate detection (serviceName + version)
- Archive integrity check at publish time (PoC: optional checksum; Production: required SHA-256)
- Image digest existence check (optional in PoC)

## Auth & Policy

> PoC: No auth; local repo for speed
>
> Production: OIDC/RBAC; signed packages required; policy enforcement

## Storage Model

- PoC: File-based storage for service metadata + schemas on local volume (simple to run offline and align with CLI pull/publish)
- Production: Metadata in RDBMS/NoSQL; schemas in a durable object store (or pluggable schema registry backend)
- Schema registry: Integrated with repository service in PoC; pluggable backend or external registry in Production
- OCI images: External registry (Docker Hub/ACR/ECR) — store digest in metadata
- Domain transformations: Stored in domain composition artifacts, not in the service repository

## Related Documents

- [Package Format](../infrastructure/15-package-format.md)
- [Schema Registry](../infrastructure/16-schema-registry.md)
- [Evolution Policy](../governance/25-evolution-policy.md)
