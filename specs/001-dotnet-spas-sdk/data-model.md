# Data Model: .NET SPAS SDK

## Entities

- Service Metadata
  - Fields: identity, contracts, security, health
  - Relationships: references contract schemas

- Event Publishing Context
  - Fields: topic (routing), eventType (CloudEvents type), payload (domain data)
  - Metadata propagation: trace context (traceparent), correlation ID, service name, identity (optional)
  - Transport: HTTP headers to sidecar, raw JSON payload in body
  - Note: SDK does NOT construct CloudEvents envelope; sidecar wraps payload using headers

- Inbound Request Context
  - Fields: trace context (traceparent), correlation ID, user ID, tenant ID
  - Transport: HTTP headers from sidecar to service
  - Populated into: `SpasTrace` (trace context) and `SpasContext` (correlation/identity)

## Validation Rules

- spas.json must conform to repository JSON schema
- Contracts reference versioned schemas; additive-only evolution
- Event type must be reverse-DNS format (e.g., `com.example.order.created`)
- Trace context must follow W3C Trace Context format when present

## State Transitions

- Metadata fragments → SDK composition → canonical spas.json (dev)
- Publish events → SDK sends payload + headers → sidecar wraps CloudEvents → message broker
- Inbound requests → sidecar extracts CloudEvents → invokes service with headers → SDK populates context
