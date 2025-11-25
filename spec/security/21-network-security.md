# Network Security

## Ingress

- No direct ingress to services; only via API Gateway

## Egress

- Default deny; allow-list exceptions
- Enclosure levels: strict | moderate | open
  - PoC: Declarative only (metadata/choreography.yaml)
  - Production: Enforced via NetworkPolicies/service mesh

## Encryption

- TLS 1.3 at the edge; mTLS for east–west

## Sidecar Enforcement

- Mandatory sidecar for all traffic
- No service-to-service sync calls

## Related Documents

- [Security Model](19-security-model.md)
- [Runtime Environment](../infrastructure/15-runtime-environment.md)
- [Data Security](22-data-security.md)
