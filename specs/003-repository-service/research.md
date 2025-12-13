# Research & Decisions (Phase 0)

This document consolidates unknowns and proposes options for the SPAS Repository Service PoC. Items marked NEEDS DECISION are open for dialog.

## Unknowns extracted from Technical Context

- Language/runtime: NEEDS DECISION (shortlist below)
- Libraries: NEEDS DECISION (ZIP handling, JSON Schema validation, logging)
- Production storage: NEEDS DECISION (document store + object storage)
- Observability stack: NEEDS DECISION (OTel SDK choice per language)

## Technology Shortlist

### Service implementation language
- .NET 8 Minimal API
  - Pros: Strong typing, good Windows/Linux support, good tooling; matches existing SDK in repo
  - Cons: Heavier runtime than Node; JSON Schema libs vary
- Node.js 20 (Fastify)
  - Pros: Fast dev cycle, excellent JSON tooling, good ZIP libs
  - Cons: Single-threaded; requires discipline for structure
- Python 3.11 (FastAPI)
  - Pros: Rapid prototyping, rich JSON/ZIP ecosystem
  - Cons: Perf overhead; GIL considerations

Decision: NEEDS DECISION

### JSON Schema validation
- Node: ajv
- .NET: Newtonsoft.Json.Schema or NJsonSchema
- Python: jsonschema

Decision: NEEDS DECISION

### ZIP processing (multipart archive)
- Node: `adm-zip` or `yauzl` / `unzipper`
- .NET: `System.IO.Compression`
- Python: `zipfile`

Decision: NEEDS DECISION

### Storage
- PoC: Local file-based with structure:
  - `data/{serviceName}/{version}/spas.json`
  - `data/{serviceName}/{version}/schemas/{schemaName}.json`
  - `data/index.json` (capabilities, boundedContext to speed search)
- Production: PostgreSQL (JSONB) for metadata + S3-compatible object store for schemas

Decision: NEEDS DECISION

## API & Validation Patterns

- Path-keyed identity: `POST /services/{serviceName}:{version}` (source of truth)
- Content-Type: multipart/form-data with part `archive` (ZIP); optional part `checksum` (SHA-256) per clarification
- Validation sequence:
  1. Parse path identity; check duplicate
  2. Unpack ZIP; ensure `spas.json` exists; load schemas
  3. Validate `spas.json` against SPAS schema; check required fields
  4. Confirm path identity matches `spas.json`
  5. If `checksum` present, verify SHA-256 against ZIP bytes (PoC optional; production required)
  6. Enforce additive-only schema evolution versus latest version
  7. Persist metadata + schemas atomically

## Decision Log (running)

- 2025-12-13: Clarified checksum delivery as multipart part `checksum`. Added FR-008a, FR-034a.

## Recommendation (initial)

- Choose Node.js 20 + Fastify for PoC
  - Reasons: Strong JSON/ZIP tooling, fast iteration, minimal overhead
- File layout as above; add a small `index.json` for search speeds
- Use Ajv for JSON Schema; add custom rule checks based on SPAS governance

Status: NEEDS DECISION — Confirm language and storage choices.
