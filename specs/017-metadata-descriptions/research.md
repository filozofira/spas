# Research — Metadata Descriptions (017)

## Decisions

### 1) Schema locations to update

- Decision: Update design-time schema at `components/sdk/schemas/design-time-metadata-v1.schema.json` and runtime schema at `components/repository/schemas/runtime-metadata-v1.schema.json`.
- Rationale: These are the canonical schema locations currently present in the repo.
- Alternatives considered:
  - Keep both schemas under `components/repository/schemas/` (not aligned to current repo structure).

### 2) Transformer behavior

- Decision: Preserve `description` fields by default during design-time → runtime transformation.
- Rationale: Current transformer only changes `schemaVersion`; it already spreads the input object and returns it, so new optional fields flow through automatically.
- Alternatives considered:
  - Explicitly map `description` fields (unnecessary unless future transformations restructure fields).

### 3) Description semantics

- Decision: `description` is plain text (no Markdown semantics) and MAY contain newlines.
- Rationale: Keeps authoring simple, avoids inconsistent rendering/interpretation, supports multi-sentence descriptions.
- Alternatives considered:
  - Markdown (adds parsing/rendering expectations and ambiguity).

### 4) Schema validation constraints

- Decision: Schemas MUST NOT enforce `minLength` or `maxLength` for `description`.
- Rationale: Backward compatibility + avoids “policy” encoded in schema; quality guidance belongs in docs.
- Alternatives considered:
  - `minLength: 1` (blocks empty strings but still a policy choice).
  - `minLength: 20` (enforces quality but too restrictive).

### 5) Current SDK state (baseline)

- Decision: Treat this feature as extending existing partial support.
- Rationale:
  - Java already supports service-level `description` in `@SpasService` and `ServiceMetadata`.
  - .NET already has `Description` on `ServiceIdentity` and `EndpointContract` models/builders, but attributes don’t expose descriptions consistently and events lack description.
- Alternatives considered:
  - Rebuild metadata models from scratch (unnecessary; introduces churn).

### 6) Agent prompt location

- Decision: Update the SPAS composition agent prompt at `.github/agents/spas.compose.agent.md`.
- Rationale: This is the single prompt that drives choreography composition and includes the “Service Metadata (spas.json) Schema” reference used by the agent.
- Alternatives considered:
  - Update global copilot instructions (explicitly out of scope).

## Notes / Implications

- Description fields should be omitted when empty (SDKs), but schemas should remain permissive.
- Agent guidance should emphasize: descriptions are the primary semantic signal for matching/selecting candidates; no prioritization between endpoint vs event types.
