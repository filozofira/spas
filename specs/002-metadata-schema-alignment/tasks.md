# Tasks: Service Metadata Schema Alignment

Feature: Service Metadata Schema Alignment (design-time only)

## Phase 1: Setup

- [X] T001 Confirm .NET target net10.0 in components/sdk/dotnet/*/*.csproj
- [X] T002 Add JsonSchema.Net to SDK test project dependencies in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/Spas.Sdk.Metadata.Tests.csproj
- [X] T003 Ensure xUnit is configured and referenced across components/sdk/dotnet/test/*

## Phase 2: Foundational

- [X] T004 Implement schemaVersion emission in SDK metadata composer in components/sdk/dotnet/src/Spas.Sdk.Metadata/
- [X] T005 Update endpoint contract model to include schemaRef in components/sdk/dotnet/src/Spas.Sdk.Metadata/
- [X] T006 Ensure events[] use schemaRef uniformly in components/sdk/dotnet/src/Spas.Sdk.Metadata/
- [X] T007 Add consistency block (commands ACID, queries STRONG/EVENTUAL) to composer in components/sdk/dotnet/src/Spas.Sdk.Metadata/
- [X] T008 Add network.requiredEgress field handling to composer in components/sdk/dotnet/src/Spas.Sdk.Metadata/
- [X] T009 Add security.authentication (optional) + required dataClassification[] in composer in components/sdk/dotnet/src/Spas.Sdk.Metadata/

## Phase 3: User Story 1 (P1) — Schema Consistency Across Framework

Goal: SDK emits design-time metadata exactly matching 06-service-metadata.md
Independent Test: Validate SDK output against design-time-metadata-v1 using JsonSchema.Net

- [X] T010 [P] [US1] Add JSON Schema file reference path resolution for validation in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/
- [X] T011 [US1] Write unit test: compose metadata and validate against schema in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/
- [X] T012 [P] [US1] Update SampleService to emit endpoints[].schemaRef and events[].schemaRef in components/sdk/dotnet/examples/SampleService/
- [X] T013 [US1] Write unit test: check presence of schemaVersion, consistency, network.requiredEgress, security.dataClassification in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/
- [X] T014 [US1] Remove/replace any legacy fields (grpcMethod/category, eventsSubscribed, allowedEgress, security.level) in components/sdk/dotnet/src/Spas.Sdk.Metadata/

## Phase 4: Polish & Cross-Cutting

- [X] T015 Update docs: components/sdk/dotnet/README.md section on design-time metadata alignment and net10.0 reference
- [X] T016 Add quickstart validation snippet referencing JsonSchema.Net in specs/002-metadata-schema-alignment/quickstart.md
- [X] T017 Ensure CLI usage note: schema distribution via CLI/repository (SDK emits schemaVersion only) in specs/002-metadata-schema-alignment/spec.md

## Dependencies

- US1 depends on Foundational tasks T004–T009
- SampleService updates (T012) can run in parallel with tests (T011, T013) once foundational changes compile

## Parallel Execution Examples

- T010 and T012 can execute in parallel (different files)
- T005, T006, T008 are parallelizable if models are separate

## Implementation Strategy

- MVP: Complete Phase 2 + US1 validation tests (T004–T014)
- Incremental: Polish docs and quickstart (T015–T017)
