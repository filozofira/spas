# Runtime Environment

Defines execution assumptions for SPAS services.

## Containers

- OCI-compliant images; non-root user; read-only FS (except data)
- Resource limits (CPU/memory); health endpoints required

## Sidecar Injection

- PoC: SPAS sidecar component (custom implementation for transformation and messaging)
- Production: Platform-injected sidecar compatible with service meshes (Istio/Linkerd) for mTLS and policy
- SPAS sidecar handles transformation execution, CloudEvents wrapping, trace context propagation
- Service mesh handles mTLS, routing, schema validation (Production), metrics

## Networking

- Default deny egress; allow-list exceptions
- No direct ingress to services; edge gateway terminates external traffic
- Enclosure levels (PoC: declarative only; Production: enforced via policies)

## Configuration & Secrets

- Environment variables and config files
- External secret stores (Vault/cloud KMS) recommended

## Observability

- OpenTelemetry traces/metrics/logs
- Prometheus scraping; structured JSON logs

## Platforms

- Kubernetes (primary), Docker Compose (local)
- Bare metal (future consideration; not targeted in PoC)

## Related Documents

- [Sidecar Contract](../component-specification/10-sidecar-contract.md)
- [Network Security](../security/21-network-security.md)
- [Security Model](../security/19-security-model.md)
