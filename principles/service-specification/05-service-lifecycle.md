# Service Lifecycle

Defines expectations from authoring through retirement.

## Authoring

- Define bounded context, aggregates, and contracts first
- Generate service stubs and SDK scaffolding
	- Production: gRPC stubs (proto-first)
	- PoC: HTTP handlers/OpenAPI (JSON over HTTP)

## Building

- Compile and test; run contract tests against schemas
- Validate `spas.json` using CLI

## Packaging

- Build OCI image (non-root, health endpoints)
- Embed version and commit metadata labels (OCI annotations such as `org.opencontainers.image.version`, `org.opencontainers.image.revision` for traceability)

## Publishing

- Push image to registry
- Publish metadata to SPAS repository
- (Production) Sign artifacts

## Deployment

- Deploy with platform-injected sidecar
- Configure environment variables and secrets
- Deploy transformation mapping artifacts (e.g. ConfigMap, CRD, or mounted files) referenced by `choreography.yaml` so sidecar can load them

## Adaptation

- Provide internal schemas for mapping (service-owned)
- Bind choreography via `choreography.yaml` (domain composition descriptor)
- External mapping files versioned alongside choreography for rollback capability

## Operation

- Expose metrics, logs, traces (OTel)
- (Production) Define SLOs and alerts; PoC may omit

## Versioning & Upgrade

- Follow semver for API/events/metadata
- Support parallel versions for safe migration

## Retirement

- Publish deprecation notices
- Provide migration guidance

## Related Documents

- [Service Metadata](06-service-metadata.md)
- [Package Format](../infrastructure/15-package-format.md)
- [CLI Specification](../component-specification/13-cli-specification.md)
