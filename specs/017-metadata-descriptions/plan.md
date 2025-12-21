# Implementation Plan: Metadata Descriptions for AI-Assisted Choreography

**Branch**: `017-metadata-descriptions` | **Date**: 2025-12-21 | **Spec**: `specs/017-metadata-descriptions/spec.md`
**Input**: Feature specification from `specs/017-metadata-descriptions/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add optional plain-text `description` fields to SPAS metadata at the service, endpoint, and event levels; ensure repository runtime metadata preserves and returns them; extend Java/.NET SDK authoring surfaces; and update the SPAS choreography composition agent prompt to use descriptions as the primary semantic signal when matching intent.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (Node.js) + Java (Maven/Spring Boot) + .NET  
**Primary Dependencies**: JSON Schema, TypeScript toolchain (repo/sidecar), Java annotations/runtime reflection (metadata), .NET attributes + metadata composer  
**Storage**: Repository persistence (existing; not changed by this feature)  
**Testing**: Jest (TypeScript), JUnit (Java), xUnit (C#)  
**Target Platform**: Developer workstation + containerized runtime (existing SPAS PoC stack)
**Project Type**: Monorepo with multiple components (repository + SDKs + agent prompt)  
**Performance Goals**: No measurable runtime perf change expected beyond small metadata payload increases  
**Constraints**: Backward compatible schemas/SDKs; schemas must not enforce description length constraints; descriptions are plain text and may contain newlines  
**Scale/Scope**: Small, cross-component additive change (schemas, SDK models/attributes/annotations, transformer pass-through, agent prompt)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Gates relevant to this feature (from `.specify/memory/constitution.md`):

- **SDK quality gates**: Unit tests are non-negotiable; target ≥ 80% coverage for description-related code paths (aligns with SC-008). **PASS (planned)**
- **Design-time metadata endpoint boundaries**: Metadata aggregation only; no persistence/publishing in SDK runtime endpoint. This feature only adds optional fields. **PASS**
- **No direct service-to-service communication**: Not impacted (metadata-only + prompt updates). **PASS**
- **Convention over configuration**: Not impacted. **PASS**

Re-check after Phase 1 design: **PASS** (no new architecture violations introduced by the design artifacts).

## Project Structure

### Documentation (this feature)

```text
specs/017-metadata-descriptions/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
components/
├── repository/
│   ├── schemas/
│   │   └── runtime-metadata-v1.schema.json
│   └── src/utils/metadata-transformer.ts
├── sdk/
│   ├── schemas/
│   │   └── design-time-metadata-v1.schema.json
│   ├── java/spas-sdk-metadata/
│   │   └── src/main/java/io/spas/sdk/metadata/
│   └── dotnet/src/Spas.Sdk.Metadata/
└── sidecar/  # not modified by this feature

.github/agents/
└── spas.compose.agent.md
```

**Structure Decision**: Monorepo cross-component change touching schemas, repository transformer, Java/.NET SDK metadata authoring, and a single agent prompt file.

## Phase Outputs

### Phase 0 — Research

- Created `specs/017-metadata-descriptions/research.md` with decisions covering schema locations, transformer behavior, semantics (plain text + newlines), schema constraints (no min/max length), baseline SDK state, and the target agent prompt file.

### Phase 1 — Design & Contracts

- Created `specs/017-metadata-descriptions/data-model.md` documenting the new optional `description` fields at service/endpoint/event levels.
- Created `specs/017-metadata-descriptions/contracts/repository-service.openapi.yaml` as an API contract excerpt for runtime metadata responses including optional descriptions.
- Created `specs/017-metadata-descriptions/quickstart.md` describing how to use and verify descriptions end-to-end.
- Updated agent context via `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`.

## Phase 2 — Planning (for /speckit.tasks)

Produce `specs/017-metadata-descriptions/tasks.md` (in a separate step using `/speckit.tasks`) with tasks organized roughly as:

1) Schemas
  - Add optional `description` fields to `components/sdk/schemas/design-time-metadata-v1.schema.json`.
  - Add optional `description` fields to `components/repository/schemas/runtime-metadata-v1.schema.json`.
  - Ensure schemas reject non-string `description` values and do not enforce `minLength`/`maxLength`.

2) Repository / transformer
  - Confirm `transformToRuntimeMetadata` preserves description fields (existing spread behavior).
  - Add/adjust unit tests in the repository component to cover description pass-through.

3) Java SDK
  - Extend `@SpasCommand`, `@SpasQuery`, `@SpasEvent` annotations with optional `description()`.
  - Add `description` fields to `EndpointContract` and `EventContract` models.
  - Update metadata composition logic to omit empty descriptions.
  - Add unit tests for description emission.

4) .NET SDK
  - Add `Description` properties to `[SpasService]`, `[SpasCommand]`, `[SpasQuery]`, `[SpasEvent]` attributes.
  - Ensure emitted metadata omits null/empty descriptions.
  - Add missing `description` to event model (`EventContract`) and wire through composer.
  - Add unit tests.

5) Agent prompt
  - Update `.github/agents/spas.compose.agent.md` to explicitly instruct reading/quoting descriptions as the primary semantic signal for matching intent (and not prioritizing endpoint vs event types).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations anticipated for this feature.
