# Testing Harness

Defines testing strategies and utilities for SPAS services.

## Unit & Integration

- Mockable event publishers/subscribers
- Local event bus emulation for integration tests

## Contract Testing

### PoC: HTTP (Pact-style Flow)

1. Consumer defines expected HTTP request/response examples → generates pact artifact
2. Provider test harness replays pact interactions against implementation
3. Failures produce diff (missing field, incompatible type)

### Production: gRPC (Pact-style Flow)

1. Consumer defines expected gRPC request/response examples → generates pact artifact
2. Provider test harness replays pact interactions against implementation
3. Failures produce diff (missing field, incompatible type)

### Events

1. Producer publishes event schema + example payload
2. Schema diff tool validates additive-only evolution
3. Consumers verify mapping correctness (domain ↔ internal) using mapping files
4. Optional replay harness replays captured CloudEvents JSON payloads

### Validation Outputs

- Schema compatibility status
- Mapping coverage (percentage of fields transformed)
- Idempotency key usage (commands/events where strategy=KEY/NATURAL)

## Choreography Simulation

- Compose multiple services locally using `choreography.yaml` + mapping files
- Inject synthetic events to test end-to-end transformations

## Performance

- Load generation utilities

## Fixtures & Generators

- Sample CloudEvents payloads & schemas
- Synthetic event generators (future)
- Event replay file format: NDJSON (one CloudEvents object per line)

## Related Documents

- [Event Protocol](../protocol-specification/09-event-protocol.md)
- [SDK Specification](../component-specification/12-sdk-specification.md)
- [Reference Examples](../appendix/26-reference-examples.md)
