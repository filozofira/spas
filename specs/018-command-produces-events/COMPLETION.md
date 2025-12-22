# Completion Report: Command Produced Events Mapping

**Feature**: 018-command-produces-events  
**Date Completed**: December 22, 2025  
**Implementation Status**: ✅ Complete (PoC) - All 32 tasks (100%)

---

## Summary

This feature adds an explicit, structured **command → produced events** mapping to SPAS service metadata to reduce choreography guesswork and improve agent-assisted composition.

The primary change is a new `commands[]` contract list (canonical) with `commands[].produces[]` entries referencing declared events by `(type, version)` with PoC-scoped semantics `when: "success"`.

**Key outcomes**:

- ✅ Metadata supports explicit command→event relationships (no source-code inference).
- ✅ Both SDKs support developer-declared mapping using event types/classes (no string duplication).
- ✅ Validation fails fast on inconsistent mappings (missing refs, duplicates, missing event annotations).
- ✅ Downstream tooling (spas-compose + sidecar config schema) updated for compatibility.

---

## Completed User Stories

### US1: Discover produced events per command (P1) 🎯 MVP ✅

**Requirement**: Service metadata expresses which events a command produces on success, via structured references.

**Implementation Highlights**:

- Extended **design-time** and **runtime** metadata schemas to support:
  - `commands[]`
  - `commands[].name` (canonical kebab-case)
  - `commands[].produces[]` objects: `{ type, version, when: "success" }`
- Documented semantics in principles and spec docs.

---

### US2: Declare produced events with minimal developer effort (P2) ✅

**Requirement**: Developers declare produced events via event types/classes, and the SDK resolves `(type, version)` from the event annotation/attribute.

**Implementation Highlights**:

- **.NET SDK**:
  - Added `Produces` support on command attributes.
  - Emits `commands[].produces[]` with `(type, version)` derived from `[SpasEvent]`.
- **Java SDK**:
  - Added `produces()` to `@SpasCommand`.
  - Emits `commands[].produces[]` with `(type, version)` derived from `@SpasEvent`.

---

### US3: Fail fast on inconsistent metadata (P3) ✅

**Requirement**: Prevent publishing/consuming inconsistent command→event mappings.

**Implementation Highlights**:

- **Repository validation** fails when:
  - a produced `(type, version)` does not exist in `events[]`
  - duplicates exist within a command’s `produces[]`
- **SDK validation** fails when:
  - referenced produced event types/classes lack `SpasEvent` / `@SpasEvent`
  - produced `(type, version)` is not declared in `events[]`
  - duplicates exist within a command’s `produces[]`

---

## Downstream Compatibility

### spas-compose (Choreography + Agent Prompt)

- Updated choreography parsing/generation so `commands[]` is authoritative for command contracts.
- Updated agent prompt guidance to use `commands[].produces[]` for command→event edges, joining to `endpoints[]` only for invocation details.

### Sidecar schema + init scaffolding

- Updated sidecar config schema validation to accept canonical kebab-case command identifiers (while still accepting legacy PascalCase).
- Updated `spas-compose init` scaffolding template so newly generated workspaces get the aligned schema.

---

## Validation and Test Results

### Automated Tests

- **Repository (Jest)**: 11 test suites, 152 tests ✅
- **Sidecar (Jest)**: 13 test suites, 195 tests ✅
- **spas-compose (Jest)**: 12 test suites, 219 tests ✅

### SDK Tests

- **.NET SDK**: `dotnet test` ✅ (executed by the maintainer; assistant does not run .NET tests due to VS Code stability constraints)
- **Java SDK**: not captured in this run (environment execution was interrupted)

---

## Notable Fixes During Completion

- **Canonical naming consistency**: ensured endpoint names emitted by SDK discovery align with command kebab-case to avoid broken joins.
- **Schema reference generation**: ensured auto-generated `schemaRef` values use kebab-case (not naive lowercasing).
- **Service identity ergonomics**: schema still requires `name`, but SDK generation defaults `name = id` when unset/blank.

---

## Key Files Changed (High Level)

- Principles/docs:
  - `principles/service/06-service-metadata.md`
  - `principles/protocol/09-event-protocol.md`
- Repository schema + validation:
  - `components/repository/schemas/design-time-metadata-v1.schema.json`
  - `components/repository/schemas/runtime-metadata-v1.schema.json`
  - `components/repository/src/validation/SpasSchemaValidator.ts`
- SDKs:
  - `components/sdk/dotnet/src/Spas.Sdk.Metadata/**`
  - `components/sdk/java/**`
- Downstream tooling:
  - `components/cli/spas-compose/src/**`
  - `components/sidecar/schemas/sidecar-config-v1.schema.json`
- Examples:
  - `examples/services/**` (updated service code to declare produces metadata; no direct edits to `examples/**/spas.json`)

---

## Known Limitations (PoC)

- `when` is PoC-scoped and must be exactly `"success"`.
- Produced events are modeled for **commands** only; queries do not declare `produces`.
- Mapping is **developer-declared** (no inference from handler bodies or runtime traces).
