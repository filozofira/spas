# Core Principles

These principles are stable across versions and apply to all SPAS services and tooling.

## Self-Contained

- One bounded context per service
- No synchronous cross-context calls; integration via events or edge gRPC only
- Encapsulated state and domain model

## Portable

- OCI container images; non-root, minimal base, health endpoints
- No mandatory external infrastructure (SDKs are infrastructure-agnostic)
- Runs on Kubernetes, Docker Compose, or bare metal with the same package

## Adaptable

- Services bind to Domain Contexts using configuration, not code
- Use `choreography.yaml` to define Domain Composition: services, routing, and transformations
- Sidecar/mesh performs protocol handling and transformations

## Convention over Configuration

- `SERVICE_NAME` is the single source of identity; sidecar hostnames derive as `${SERVICE_NAME}-sidecar`
- Sidecars invoke services via relative paths (for example, `/incoming`) and compose the full URL from `SERVICE_NAME` + `SERVICE_PORT`
- Ports remain explicit, but hosts and endpoints follow conventions to minimize per-service config

## Event-First

- East–West communication is asynchronous by default
- Events carry the state, correlation, identity and trace metadata (W3C Trace Context)
- Schemas are versioned and backward compatible (additive evolution)

## Consistency & Idempotency

- Commands are ACID; queries MAY be eventually consistent
- Services declare idempotency strategies; SDK helpers are optional

## Security by Default

- Zero-trust: mTLS for east–west between the sidecar and the service; OIDC/JWT at the edge
- Default deny egress; declare enclosure levels (strict | moderate | open)
- Data classification declared in metadata; enforceable in production

## Observability First

- OpenTelemetry for traces, metrics, and logs
- Prometheus metrics; structured JSON logs
- Health and readiness endpoints

## Related Documents

- [Introduction](00-introduction.md)
- [Service Model](service-specification/03-service-model.md)
- [Communication Model](protocol-specification/07-communication-model.md)
