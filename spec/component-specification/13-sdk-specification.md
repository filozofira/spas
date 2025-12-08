# SDK Specification

Defines a language-agnostic contract for SDKs, aligned with `analysis/high-level-component-list.md`.

## Target Languages

- .NET, Java, Node.js (TypeScript), Python, Go

## Required Capabilities (PoC)

- Metadata authoring & validation for `spas.json`, including decomposition/merge of design-time metadata files
- Design-time metadata endpoint helper (optional) to expose `/_spas/metadata` in dev/local
- CloudEvents helpers (build/publish with trace + correlation) and identity extraction util (payload or headers)
- Inbound endpoint scaffolding: attributes/base classes for handlers and payload contracts
- Event publish helper (SPAS Service to sidecar/Dapr) with basic reliability; future outbox abstraction is optional in PoC
- Configuration helpers: env/file loading with optional secret-source hook; keep transport/storage abstractions pluggable
- Testing utilities: schema-driven fixtures; stub generators for contracts

## Future Capabilities (Production)

- Outbox pattern abstraction with at-least-once delivery guarantees
- Mapping test harness integration for transformations
- Enhanced idempotency utilities
- SDK extension points for custom serialization (Avro/Proto)
- PII/subject data endpoints scaffolding (opt-in)
- gRPC scaffolding and codegen (if/when transport changes)

## Design Constraints

- No mandatory external infrastructure; SDK should work locally with file/env configuration
- Do not duplicate sidecar concerns; SDK avoids mesh-specific clients and focuses on app-level code
- Pluggable transport/storage abstractions for future extensibility (publish, config, secrets)

## Developer Experience

- Project templates and scaffolding per language
- Clear diagnostics for metadata and schema validation

## Related Documents

- [Service Contract](../service-specification/04-service-contract.md)
- [gRPC Protocol](../protocol-specification/08-grpc-protocol.md)
- [Testing Harness](../tooling/18-testing-harness.md)
