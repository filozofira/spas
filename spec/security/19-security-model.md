# Security Model

Defines security principles for SPAS services and platform.

## Principles

- Zero-trust by default
- Defense in depth (edge, sidecar/mesh, runtime application layer)
- Least privilege and default deny

## Threat Model (High Level)

- Network egress abuse → Mitigate via `network.allowedEgress[]` + enclosure policies
- Identity spoofing & token leakage → mTLS + short-lived token rotation + SPIFFE identities
- Schema drift causing deserialization issues → enforced additive-only evolution
- Supply chain tampering → signed commits, dependency scanning (SCA), SBOM (CycloneDX), image signing (cosign), provenance (SLSA targets)

## PoC vs Production

- PoC: Declarative policies in metadata; limited enforcement; signing optional
- Production: Enforced by sidecar/mesh and platform policies; mandatory signing & provenance, policy engines (OPA) for egress and enclosure

## Related Documents

- [Identity & Access](20-identity-access.md)
- [Network Security](21-network-security.md)
- [Compliance Checklist](../governance/24-compliance-checklist.md)
