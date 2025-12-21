# Repository Specification

Defines the SPAS repository API and storage model.

## Responsibilities

- Store `spas.json` (design-time metadata) and schema artifacts for services
- Accept and store runtime deployment metadata (image digest, repository, tag) separate from design-time metadata
- Merge design-time and runtime metadata in API responses (see [Service Metadata](../service/06-service-metadata.md) for runtime schema)
- Index services by `serviceName`, `version`, `capabilities`, `boundedContext`
- Link to OCI images in external registries (store image digest for integrity)

## Metadata Descriptions

Design-time service metadata MAY include optional plain-text `description` fields (service/endpoints/events).

Repository responsibilities for descriptions:

- **Preserve** descriptions as-authored (no rewriting, truncation, or interpretation).
- **Validate structurally** via schema (type = string) but do not attempt semantic validation.
- **Be permissive**: tooling and agents must tolerate missing or incomplete descriptions.

## API Endpoints (baseline)

Natural key aligns with CLI (`spas-service pull <name> <version>`):

- `POST /services/{serviceName}:{version}` — publish metadata (PoC: multipart/form-data with `archive` ZIP containing `spas.json` + schemas; optional runtime fields: `imageDigest`, `imageRepository`, `imageTag`; path `{serviceName}:{version}` is the source of truth)
- `GET /services/{serviceName}` — service details (includes runtime metadata if available)
- `GET /services/{serviceName}/versions` — list versions
- `GET /services/{serviceName}/versions/{version}` — complete metadata with runtime merged from storage
- `GET /services/{serviceName}/versions/{version}/download` — download archive (spas.json with runtime merged + all schemas)
- `GET /services/{serviceName}/versions/{version}/schemas` — list schemas
- `GET /services/{serviceName}/versions/{version}/schemas/{schemaName}` — retrieve schema
- `GET /services?capability={cap}` — search by capability
- `GET /services?boundedContext={context}` — search by bounded context
- `DELETE /services/{serviceName}/versions/{version}` — unpublish

## Metadata Enrichment

All GET endpoints that return service metadata **enrich** design-time JSON with runtime deployment information:

- **Input at Publish**: Design-time `spas.json` stored in `metadata` column; runtime fields (`imageDigest`, `imageRepository`, `imageTag`) stored in dedicated database columns
- **Output on Retrieval**: Repository merges runtime fields into the response object under `runtime` property:

  ```json
  {
    "schemaVersion": "design-time-metadata-v1",
    "id": "order-service",
    "version": "1.0.0",
    ...
    "runtime": {
      "digest": "sha256:abc123...",
      "repository": "ghcr.io/org/order-service",
      "tag": "1.0.0",
      "image": "ghcr.io/org/order-service@sha256:abc123..."
    }
  }
  ```

- **Separation Rationale**: Design-time metadata (`spas.json`) remains clean and authored by service developers; runtime metadata is deployment-specific and added by CI/CD or platform tooling at publish time
- **Applies to**: All GET endpoints returning service metadata (service details, version metadata, download archives, search results)

## Validation

- Schema validation of `spas.json`
- Duplicate detection (serviceName + version)
- Archive integrity check at publish time (PoC: optional checksum; Production: required SHA-256)
- Image digest existence check (optional in PoC)
- Path authority: `{serviceName}:{version}` in URL MUST match values declared in `spas.json` inside the archive; mismatch results in conflict (409)
- Multipart handling (PoC): Only `archive` part is required; optional runtime parts (`imageDigest`, `imageRepository`, `imageTag`) are stored in dedicated database columns; repository extracts `spas.json` + schemas and validates per rules

### Cross‑Component Boundaries (See Constitution)

- Source of Truth: Stores canonical `spas.json` and schemas post‑publish; serves retrieval APIs to CLI and tooling (Constitution → Repository Service → Responsibilities & Boundaries).
- Publish Validation: Enforces schema validity, versioning rules, and additive‑only evolution for events/schemas.
- No Design‑time Aggregation: Does not host service dev aggregation; design‑time metadata assembly resides with the service/SDK when enabled.

## Auth & Policy

> PoC: No auth; local repo for speed
>
> Production: OIDC/RBAC; signed packages required; policy enforcement

## Storage Model

- PoC: SQLite (embedded database) for service metadata + schemas with JSON support (enables offline operation, ACID transactions, native JSON queries; single file `repository.db` on local volume)
  - Design-time metadata: Stored in `metadata` column as JSON (from spas.json)
  - Runtime metadata: Stored in dedicated columns (`image_digest`, `image_repository`, `image_tag`) and merged into API responses
- Production: Metadata in PostgreSQL (JSONB); schemas in S3-compatible object store; runtime metadata in dedicated columns
- Migration Path: Storage abstraction layer (IStorageProvider interface) enables PoC-to-Production migration without code changes
- Schema registry: Integrated with repository service in PoC; pluggable backend or external registry in Production
- OCI images: External registry (Docker Hub/ACR/ECR) — store digest in metadata
- Domain transformations: Stored in domain composition artifacts, not in the service repository

## Related Documents

- [Service Metadata](../service/06-service-metadata.md) — Defines design-time vs runtime metadata schema
- [Package Format](../infrastructure/15-package-format.md)
- [Schema Registry](../infrastructure/16-schema-registry.md)
- [Evolution Policy](../governance/25-evolution-policy.md)
