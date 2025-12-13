# Identity & Access

## Service Identity

- Production: SPIFFE/SPIRE SVID certificates (X.509) or equivalent for workload identity (used in mTLS peer auth)
- PoC: No workload identity (deferred per ADR-015)
- Short-lived tokens (OAuth2/JWT) with automatic rotation fetched by sidecar or auth agent; reduces replay window (Production)

## Authentication

- North–South: User/auth client authenticated at API Gateway (OIDC/JWT); gateway forwards validated identity (JWT or signed headers) to service
- East–West: PoC: HTTP with identity propagation via CloudEvents payload and headers; Production: mTLS between sidecars; service receives caller identity via sidecar-injected headers/certs (no direct trust on external JWT)

## Authorization

- Attribute-based access control (ABAC) at sidecar
  - PoC: Policies declared in metadata but not enforced
  - Production: Enforced by sidecar
- Policies evaluate claims (roles, capabilities) and service metadata (capabilities[], enclosure)

## Identity Propagation

- Sidecar augments outbound CloudEvents with identity claims (non-sensitive subset) and correlation (`correlationid`, `traceparent`)

## Related Documents

- [Security Model](19-security-model.md)
- [Communication Model](../protocol/07-communication-model.md)
- [Network Security](21-network-security.md)
