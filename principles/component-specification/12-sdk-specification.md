# SDK Specification

Defines a language-agnostic contract for SDKs, aligned with `analysis/high-level-component-list.md`.

## Target Languages

- .NET, Java, Node.js (TypeScript), Python, Go

## Required Capabilities (PoC)

Events Boundary

- SDK prepares payloads and propagates W3C Trace Context and correlation identifiers.
- Sidecar wraps outgoing events into CloudEvents 1.0 and performs transformations.
- SDK MUST NOT construct CloudEvents envelopes or implement transformation logic.

## Future Capabilities (Production)

## Design Constraints

### Inbound Routing (Route‑Agnostic)

- SDKs MUST NOT enforce a fixed inbound route. Services bind routes using their host framework.
- `/incoming` is a recommended default used in samples/templates only.
- Sidecar/choreography MUST NOT assume a fixed service route; mappings derive from metadata/configuration.

### Design‑time Metadata Endpoint — Intent & Boundaries

#### Cross‑Component Boundaries (See Constitution)

## Developer Experience

Clarifications

- Event wrapping is a sidecar concern; SDK focuses on payload + context.

## Related Documents

- [Service Contract](../service-specification/04-service-contract.md)
- [gRPC Protocol](../protocol-specification/08-grpc-protocol.md)
- [Testing Harness](../tooling/18-testing-harness.md)
