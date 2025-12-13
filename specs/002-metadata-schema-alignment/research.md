# Phase 0 Research: Design-Time Metadata Schema Alignment

## Decisions

- JSON Schema Validator: Use `JsonSchema.Net` (draft 2020-12 support) for .NET validation of `design-time-metadata-v1`.
- Testing Framework: Use xUnit across SDK test projects; validate metadata generation against schema via unit tests.
- Schema Distribution: SDK emits `schemaVersion` only; CLI and Repository provide schema files for validation (dev/local via CLI bundle; authoritative on publish via Repository).
- Endpoint Contract References: Endpoints use `schemaRef` (string reference to registry or local file) consistent with events.
- Runtime Metadata: Out-of-scope; defined in spec as `runtime-metadata-v1` and produced by Repository during publish.

## Rationale

- Validator: `JsonSchema.Net` aligns with spec’s draft 2020-12; actively maintained.
- xUnit: Matches existing .NET test projects and common ecosystem usage.
- Slim SDK: Avoid bundling schema within SDK; centralize schema in CLI/Repository for consistency.
- Consistency: Using `schemaRef` across endpoints/events simplifies tooling and schema registry integration.

## Alternatives Considered

- `NJsonSchema`: Mature library but draft-2020-12 support is less current; viable fallback if constraints arise.
- Inline `schema` for endpoints: Increases payload size; complicates reuse and registry integration; rejected in favor of `schemaRef`.
- SDK-bundled schema files: Risks version drift across tools; central distribution via CLI/Repository preferred.

## Implications

- Update SDK Metadata builders/validators to output/validate fields per spec: `schemaVersion`, `endpoints[].schemaRef`, `events[].schemaRef`, `network.requiredEgress`, `security.authentication?`, `security.dataClassification[]`, and `consistency`.
- Ensure SampleService generates design-time metadata matching `design-time-metadata-v1` and passes unit validation using `JsonSchema.Net`.
