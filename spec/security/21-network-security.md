# Network Security

## Ingress

- No direct ingress to services; only via API Gateway

## Egress

- Default deny; explicit allow-list (`network.allowedEgress[]` in `spas.json`)
- Enclosure levels (`network.enclosure`): strict | moderate | open (location: `spas.json`, not choreography)
  - PoC: Declarative only in metadata
  - Production: Enforced via NetworkPolicies/service mesh policy engine

## Encryption

- Edge: TLS 1.3 SHOULD be used (API Gateway responsibility)
- East–West: mTLS MUST be used (sidecar↔sidecar and sidecar↔service)

## Sidecar Enforcement

- Mandatory sidecar for all traffic
- No service-to-service sync calls

## Related Documents

- [Security Model](19-security-model.md)
- [Runtime Environment](../infrastructure/17-runtime-environment.md)
- [Data Security](22-data-security.md)
