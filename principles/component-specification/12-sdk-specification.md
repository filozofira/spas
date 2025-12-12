# SDK Specification

Defines a language-agnostic contract for SDKs, aligned with `analysis/high-level-component-list.md`.

## Target Languages

- .NET, Java, Node.js (TypeScript), Python, Go

## Required Capabilities (PoC)

Events Boundary

- SDK prepares payloads and propagates W3C Trace Context and correlation identifiers.
- Sidecar wraps outgoing events into CloudEvents 1.0 and performs transformations.
- SDK MUST NOT construct CloudEvents envelopes or implement transformation logic.

Event Publishing Contract (SDK → Sidecar)

- **Transport**: HTTP POST to sidecar endpoint `/publish/{topic}`
- **Payload**: Raw JSON domain data in HTTP body (NOT wrapped in CloudEvents)
- **Metadata Propagation**: HTTP headers carry CloudEvents metadata for sidecar envelope construction

Required Headers:

- `traceparent`: W3C Trace Context (format: `00-{trace-id}-{span-id}-{flags}`)
- `x-service-name`: Source service name → maps to CloudEvents `source` field
- `x-event-type`: Event type identifier → maps to CloudEvents `type` field (reverse-DNS format, e.g., `com.example.order.created`)
- `x-correlation-id`: Correlation ID → maps to CloudEvents `correlationid` extension

Optional Headers:

- `x-user-id`: User identity claim → included in CloudEvents extensions
- `x-tenant-id`: Tenant identity claim → included in CloudEvents extensions

Inbound Request Contract (Sidecar → SDK)

- **Transport**: HTTP POST from sidecar to service endpoints
- **Context Propagation**: HTTP headers carry trace and correlation context

Required Headers:

- `traceparent`: W3C Trace Context for distributed tracing continuity
- `x-event-type`: Event type identifier from CloudEvents `type` field (for event-driven invocations)
- `x-correlation-id`: Correlation ID from originating CloudEvents message

Optional Headers:

- `x-user-id`: User identity extracted from CloudEvents extensions or authentication
- `x-tenant-id`: Tenant identity for multi-tenant scenarios

SDK Responsibilities:

- Extract headers and populate `SpasTrace` (trace context) and `SpasContext` (correlation/identity)
- Propagate context through handler execution
- Include context in logs and any outbound events/calls

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
