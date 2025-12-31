# Research: Java SDK Optional Path Attribute

**Feature**: 027-java-optional-path  
**Phase**: 0 (Research & Analysis)  
**Date**: 2025-12-31

## Overview

This document captures research findings for making the `path` attribute optional in `@SpasCommand` and `@SpasQuery` Java annotations.

## Research Questions

### Q1: Current Path Handling in Runtime Generator

**Investigation**: How does `SpasMetadataArchiveGenerator` currently handle path resolution?

**Findings**:
The runtime generator already prioritizes Spring annotation inference over the explicit `path` attribute:

```java
// SpasMetadataArchiveGenerator.java lines 488-491
methodPath != null ? methodPath : normalizeMethodPath(cmd.path())
```

Where `methodPath` is derived from:
1. Class-level `@RequestMapping` path
2. Method-level `@PostMapping`, `@GetMapping`, etc. path
3. Combined via `joinPaths(classPaths[0], methodPaths[0])`

**Decision**: No logic changes needed in `SpasMetadataArchiveGenerator` - it already prefers inferred paths.

**Rationale**: Existing code handles the fallback correctly. Making `path` optional just formalizes this behavior.

---

### Q2: Compile-Time Processor Path Handling

**Investigation**: How does `SpasAnnotationProcessor` handle path?

**Findings**:
The compile-time processor directly uses `cmd.path()` without any inference:

```java
// SpasAnnotationProcessor.java line 136
cmd.path(),
```

The processor cannot easily infer paths from Spring annotations because:
1. It runs at compile time before Spring context is available
2. Spring annotation values are accessible via annotation mirrors, but the combination logic is complex
3. The processor is opt-in (`-Aspas.generateSpasJson=true`) and rarely used

**Decision**: Add validation in processor - emit compile error when path is empty AND generation is enabled.

**Rationale**: Clear feedback is better than silent failures. Users of compile-time generation can provide explicit paths.

---

### Q3: Example Services Compile-Time Configuration

**Investigation**: Do example services enable compile-time generation?

**Findings**:
Checked `basket-service/pom.xml` and `fulfillment-service/pom.xml`:
- Neither includes `-Aspas.generateSpasJson=true` in compiler arguments
- Example services use runtime generation via `--generate-metadata` flag

**Decision**: No changes needed to pom.xml files (FR-012 already satisfied).

**Rationale**: Example services already follow the recommended pattern.

---

### Q4: Agent Prompt Current State

**Investigation**: What does the agent prompt currently say about Java SDK path attribute?

**Findings**:
From `components/cli/spas-service/templates/agent-prompt.eta`:

```
### Java Pattern
- **Commands**: `@SpasCommand(name = "Name", version = "1.0", path = "/path", produces = {EventClass.class})`
- **Queries**: `@SpasQuery(name = "Name", version = "1.0", path = "/path")`
```

The template shows `path` as part of the annotation examples.

**Decision**: Update agent prompt to remove `path` from Java examples and add note about path inference.

**Rationale**: Agent-generated code should demonstrate best practices.

---

### Q5: .NET SDK Reference Implementation

**Investigation**: How does .NET SDK handle optional Path?

**Findings**:
From `components/sdk/dotnet/src/Spas.Sdk.Metadata/Attributes/SpasContractAttributes.cs`:

```csharp
/// <summary>
/// Explicit path override. If not set, path will be inferred from route template.
/// </summary>
public string? Path { get; set; }
```

The Path property:
- Is nullable (`string?`)
- Has a setter (optional)
- Falls back to route template when null
- Is documented clearly

**Decision**: Follow same pattern - make `path` optional with clear documentation.

**Rationale**: Consistency across SDKs improves developer experience.

---

### Q6: Backward Compatibility

**Investigation**: Will making path optional break existing code?

**Findings**:
Java annotation default values are source-compatible:
- Existing code with explicit `path = "/api/..."` continues to work
- New code can omit `path` entirely
- No bytecode changes for consumers

**Decision**: Change is fully backward compatible.

**Rationale**: Adding a default value to an annotation attribute is a source-compatible change in Java.

---

## Summary of Key Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Annotation Change | `String path() default ""` | Source-compatible, follows .NET pattern |
| Runtime Generator | No changes needed | Already prefers inferred paths |
| Compile-Time Processor | Add validation when enabled | Clear error better than silent failure |
| Agent Prompt | Remove path from examples | Demonstrate best practices |
| Example Services pom.xml | No changes needed | Already use runtime generation |
| Example Services code | Remove redundant path | Validate feature and clean examples |

---

## Open Questions

None - all research questions resolved. Ready to proceed to Phase 1 (Design).
