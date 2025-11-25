# Service Lifecycle

Defines expectations from authoring through retirement.

## Authoring

- Define bounded context, aggregates, and contracts first
- Generate gRPC stubs and SDK scaffolding

## Building

- Compile and test; run contract tests against schemas
- Validate `spas.json` using CLI

## Packaging

- Build OCI image (non-root, health endpoints)
- Embed version and commit metadata labels

## Publishing

- Push image to registry
- Publish metadata to SPAS repository
- (Production) Sign artifacts

## Deployment

- Deploy with platform-injected sidecar
- Configure environment variables and secrets

## Adaptation

- Provide internal schemas for mapping
- Bind choreography via `choreography.yaml`

## Operation

- Expose metrics, logs, traces (OTel)
- Define SLOs and alerts

## Versioning & Upgrade

- Follow semver for API/events/metadata
- Support parallel versions for safe migration

## Retirement

- Publish deprecation notices
- Provide migration guidance

## Related Documents

- [Service Metadata](06-service-metadata.md)
- [Package Format](../infrastructure/12-package-format.md)
- [CLI Specification](../tooling/17-cli-specification.md)
