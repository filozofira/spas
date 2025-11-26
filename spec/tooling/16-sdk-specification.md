# SDK Specification

Defines a language-agnostic contract for SDKs.

## Target Languages

- .NET, Java, Node.js (TypeScript), Python, Go

## Required Capabilities (PoC)

- Code generation for gRPC
- Metadata authoring & validation for `spas.json`
- CloudEvents builder & publish helpers (correlation + trace propagation)
- Subscription handler scaffolding (service-level only; rely on platform sidecar for transport)
- Testing utilities: schema-driven fixtures, pact-style contract stubs

## Future Capabilities (Production)

- Optional mapping test harness integration
- Enhanced idempotency utilities
- SDK extension points for custom serialization (Avro/Proto)

## Design Constraints

- No mandatory external infrastructure
- Mesh/sidecar client integration excluded (handled by platform)
- Pluggable transport/storage abstractions for future extensibility

## Developer Experience

- Project templates and scaffolding
- Clear error messages and diagnostics

## Related Documents

- [Service Contract](../service-specification/04-service-contract.md)
- [gRPC Protocol](../protocol-specification/08-grpc-protocol.md)
- [Testing Harness](18-testing-harness.md)
