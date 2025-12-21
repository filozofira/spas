# Data Model — Metadata Descriptions (017)

This feature adds an optional `description` field to service metadata at three levels: service root, endpoints, and events.

## Entities

### 1) Service Metadata (Design-time)

**Schema**: `design-time-metadata-v1`

**New field**:
- `description?: string`

**Notes**:
- Plain text only (no Markdown semantics)
- May contain newlines
- Schema MUST NOT enforce `minLength`/`maxLength`

**Relationships**:
- `endpoints[]` contains endpoint contracts
- `events[]` contains event contracts

### 2) Endpoint Contract (Design-time & Runtime)

**New field**:
- `description?: string`

**Intended meaning**:
- Purpose of the command/query
- Key inputs and expected side effects (high-level)

### 3) Event Contract (Design-time & Runtime)

**New field**:
- `description?: string`

**Intended meaning**:
- When the event is emitted
- What the event signifies for downstream consumers

## Validation Rules

- `description` MUST be a JSON string when present.
- Schemas MUST allow omitting `description` entirely.
- Schemas MUST NOT enforce `minLength` or `maxLength`.

## State / Transitions

- N/A (descriptions are static metadata, versioned with the service).
