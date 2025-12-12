# SDK Specification

Defines a language-agnostic contract for SDKs, aligned with `analysis/high-level-component-list.md`.

## Target Languages

- .NET, Java, Node.js (TypeScript), Python, Go

## Required Capabilities (PoC)

- Metadata authoring & validation for `spas.json`, with SDK builders for discrete metadata parts (service identity, contracts, security, health, etc.) and deterministic composition into a canonical `spas.json` (performed by CLI or the endpoint helper in dev)
- Design-time metadata endpoint helper (optional): expose `/_spas/metadata` in dev/local to aggregate all SDK‑registered fragments into a single, validated `spas.json` view for CLI consumption. The endpoint is for development ergonomics only and SHOULD be disabled in production.
- CloudEvents helpers (build/publish with trace + correlation) and identity extraction util (payload for PoC; headers for Production)
- Inbound endpoint scaffolding: attributes/base classes for handlers and payload contracts
- Event publish helper (SPAS Service to sidecar) with basic reliability; future outbox abstraction is optional in PoC
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

### Design‑time Metadata Endpoint — Intent & Boundaries

- Purpose: Improve developer ergonomics by providing a single runtime aggregation point for all metadata fragments authored via SDK builders.
- Scope: Aggregation only; no persistence or publishing responsibilities. The CLI orchestrates composition, pack, and publish.
- Usage: Enabled in local/dev environments; SHOULD be disabled in production. In production, the CLI composes from design‑time files/SDK outputs and publishes to the repository.
- Validation: The endpoint MUST return a schema‑valid canonical `spas.json`. Fail fast with clear diagnostics if fragments are incomplete or inconsistent.

#### Cross‑Component Boundaries (See Constitution)

- CLI responsibilities: composition, packaging, publishing (Constitution → CLI Tools → Responsibilities & Boundaries).
- Repository responsibilities: storage, validation on publish, retrieval (Constitution → Repository Service → Responsibilities & Boundaries).
- SDK endpoint is optional and dev‑only; production flows rely on the CLI and Repository.

## Developer Experience

- Project templates and scaffolding per language
- Clear diagnostics for metadata and schema validation

## Related Documents

- [Service Contract](../service-specification/04-service-contract.md)
- [gRPC Protocol](../protocol-specification/08-grpc-protocol.md)
- [Testing Harness](../tooling/18-testing-harness.md)
