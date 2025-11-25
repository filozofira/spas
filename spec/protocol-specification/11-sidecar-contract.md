# Sidecar Contract

Specifies responsibilities and interfaces for the platform-injected sidecar/mesh.

## Responsibilities

- Traffic interception: ingress/egress
- Protocol translation: gRPC ↔ events
- Identity propagation and mTLS termination
- Schema validation (PoC optional; Production required)
- Observability: metrics, logs, traces
- Policy enforcement: enclosure levels, egress allow-lists

## Configuration

- Declarative config file(s) or environment variables
- Accept mapping specs from `choreography.yaml`

## Health

- Sidecar exposes health/readiness
- Service exposes health or delegates to sidecar

## Compatibility

- Compatible with Dapr, Istio, Linkerd (implementation-agnostic)

## Related Documents

- [Communication Model](07-communication-model.md)
- [Runtime Environment](../infrastructure/15-runtime-environment.md)
- [Network Security](../security/21-network-security.md)
