# Research: Command Produced Events Mapping

## Decision 1: Represent produced-events mapping as `commands[].produces[]`

- Decision: Add a top-level `commands[]` array to `spas.json`, where each command may declare `produces[]` entries that reference declared events by `(type, version)`.
- Rationale:
  - Choreography authors and agents start from “what can I invoke?” (commands) and need to know “what happens next?” (events).
  - This is extensible to future producer types (e.g., `jobs[]`) with the same `produces[]` shape.
- Alternatives considered:
  - Add `produces[]` to `endpoints[]` items when `type == "Command"`.
    - Rejected for PoC because it mixes queries and commands in one list and makes future `jobs[]` less consistent.
  - Add `events[].emittedBy[]`.
    - Rejected because many-to-many relationships and non-command producers make reverse mapping misleading.

## Decision 2: Conditionality via `when`, PoC value fixed to `"success"`

- Decision: Each produced event reference includes `when`, required and fixed to `"success"` for PoC.
- Rationale:
  - “Success” is clear for command-driven workflows; it avoids overpromising determinism.
  - Leaves room for future values (e.g., `"failure"`) without changing meaning of `"success"`.
- Alternatives considered:
  - `when: "always"`.
    - Rejected: ambiguous when commands throw/return errors; “success” is clearer.

## Decision 3: Developer-declared mapping, with SDK resolving `(type, version)` from event types

- Decision: Service developers declare produced events using event classes/types; the SDK resolves `type` and `version` from the event annotation/attribute.
- Rationale:
  - Minimizes developer burden (no duplicated strings).
  - Eliminates typo risk and keeps mapping aligned to event contract definitions.
- Alternatives considered:
  - Attempt to infer mapping by analyzing handler bodies or runtime tracing.
    - Rejected: complex, brittle, and not guaranteed for PoC.

## Decision 4: Fail-fast validation

- Decision: Validation fails if:
  - `commands[].name` is not kebab-case
  - a produced `(type, version)` does not exist in `events[]`
  - duplicates exist within a command’s produced list
  - an SDK mapping references an event type missing `SpasEvent`/`@SpasEvent`
- Rationale:
  - Incorrect metadata is worse than missing metadata; fast-fail protects choreography tooling.

## Decision 5: Schema versioning

- Decision: Keep `schemaVersion` as `design-time-metadata-v1` and extend the schema.
- Rationale:
  - PoC wants rapid iteration without forcing a parallel schema version.
  - JSON Schema validation can accept the new optional fields without breaking existing required fields.
- Alternatives considered:
  - Introduce `design-time-metadata-v2`.
    - Deferred: would cascade changes across repository, CLI, and docs; best done when metadata format stabilizes.
