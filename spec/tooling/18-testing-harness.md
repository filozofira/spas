# Testing Harness

Defines testing strategies and utilities for SPAS services.

## Unit & Integration

- Mockable event publishers/subscribers
- Local event bus emulation for integration tests

## Contract Testing

- Consumer-driven contracts (Pact-style)
- Validate against schema registry

## Choreography Simulation

- Test services in composed scenarios using `choreography.yaml`

## Performance

- Load generation utilities

## Fixtures & Generators

- Sample events/schemas
- SDK and harness MAY provide synthetic generators
- Optional event replay for local testing

## Related Documents

- [Event Protocol](../protocol-specification/09-event-protocol.md)
- [SDK Specification](16-sdk-specification.md)
- [Reference Examples](../appendix/26-reference-examples.md)
