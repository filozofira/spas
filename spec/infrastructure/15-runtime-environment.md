# Runtime Environment

Defines execution assumptions for SPAS services.

## Containers

- OCI-compliant images; non-root user; read-only FS (except data)
- Resource limits (CPU/memory); health endpoints required

## Sidecar Injection

- Platform-injected sidecar compatible with Dapr/Istio/Linkerd
- Sidecar handles mTLS, routing, schema validation (Production), metrics, and transformation execution

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

- [Sidecar Contract](../protocol-specification/11-sidecar-contract.md)
- [Network Security](../security/21-network-security.md)
- [Security Model](../security/19-security-model.md)
