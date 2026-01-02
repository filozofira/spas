# Research: Schema Nullable Handling and Transformation Validation

**Feature**: 029-schema-nullable-validation  
**Date**: 2026-01-02

## Overview

This document resolves technical questions and design decisions for implementing correct `required` array and nullable type generation in SDK schema generators, plus agent prompt validation instructions.

---

## Research Topic 1: NJsonSchema Required/Nullable Handling (.NET)

**Question**: How does NJsonSchema determine which properties go in the `required` array and how are nullable types represented?

### Findings

NJsonSchema with `SystemTextJsonSchemaGeneratorSettings` respects .NET nullable reference types:

1. **Required Array**: By default, NJsonSchema includes properties in `required` based on:
   - Non-nullable reference types (`string`, not `string?`)
   - Value types without `Nullable<T>` wrapper
   - Properties with `[Required]` attribute

2. **Nullable Representation**: NJsonSchema generates:
   - For nullable reference types (`string?`): `"type": ["null", "string"]` OR uses `"nullable": true`
   - For `Nullable<T>` value types: Same nullable representation

3. **Configuration Required**: The current `SchemaGenerator.cs` uses `SystemTextJsonSchemaGeneratorSettings` but may need:
   - `GenerateNullableProperties = true` to ensure nullable types are marked
   - Verification that `DefaultIgnoreCondition.WhenWritingNull` doesn't suppress nullability info

### Decision

- **Approach**: Configure NJsonSchema settings to properly emit `required` array and nullable types
- **Rationale**: NJsonSchema already has this capability; we just need correct configuration
- **Alternatives Considered**: Manual post-processing (rejected - unnecessary complexity)

---

## Research Topic 2: victools/jsonschema-generator Nullable Handling (Java)

**Question**: How does the Java schema generator detect nullability and populate the `required` array?

### Findings

The victools jsonschema-generator requires explicit configuration for nullability:

1. **Nullable Module**: The `jackson-nullable-integration` module or custom configuration is needed
2. **@Nullable Annotation Detection**: Can be configured via:
   ```java
   configBuilder.forFields()
       .withNullableCheck(field -> 
           field.getAnnotation(Nullable.class) != null);
   ```

3. **Required Array**: By default, all fields are NOT required. Must configure:
   ```java
   configBuilder.forFields()
       .withRequiredCheck(field -> 
           field.getAnnotation(Nullable.class) == null);
   ```

4. **Nullable Type Syntax**: When nullable, generates `"type": ["null", "string"]` format

### Decision

- **Approach**: Add custom nullability and required checks based on `@Nullable` annotation
- **Rationale**: Aligns with spec clarification that `@Nullable` is the explicit mechanism
- **Alternatives Considered**: 
  - `Optional<T>` detection (rejected - per spec clarification)
  - All-required-by-default (rejected - doesn't handle nullable properly)

---

## Research Topic 3: Agent Prompt Phase 4 Extension

**Question**: How should the mandatory field validation be integrated into Phase 4 (Validate)?

### Findings

Current Phase 4 in `workflow-phases.eta` has three validation categories:
1. Syntax Validation (YAML, JSONata)
2. Schema Validation (service existence, schema matching)
3. Consistency Checks (participants, sources, targets)

The new validation should fit in **Schema Validation** or as a new **Mandatory Field Validation** sub-section.

### Decision

- **Approach**: Add new validation action "Mandatory Field Mapping Validation" in Phase 4
- **Rationale**: Fits logically with existing schema validation; clear separation of concerns
- **Content**:
  - Read target schema's `required` array
  - Check each transformation maps all required fields
  - Report missing fields with specific names

---

## Research Topic 4: @Nullable Annotation Package (Java)

**Question**: Which `@Nullable` annotation should the Java SDK recognize?

### Findings

Multiple `@Nullable` annotations exist:
- `javax.annotation.Nullable` (JSR-305, deprecated but widely used)
- `jakarta.annotation.Nullable` (Jakarta successor)
- `org.jetbrains.annotations.Nullable` (IntelliJ)
- `org.springframework.lang.Nullable` (Spring)
- `org.checkerframework.checker.nullness.qual.Nullable` (Checker Framework)

### Decision

- **Approach**: Support multiple annotation packages via annotation name matching (check for any `@Nullable` annotation regardless of package)
- **Rationale**: Maximum developer flexibility; doesn't force specific dependency
- **Implementation**: Check `annotation.annotationType().getSimpleName().equals("Nullable")`
- **Alternatives Considered**: Single package (rejected - too restrictive)

---

## Summary of Decisions

| Topic | Decision | Implementation Notes |
|-------|----------|---------------------|
| .NET Nullable | Configure NJsonSchema settings | `GenerateNullableProperties = true` |
| Java Nullable | Custom nullability check | Match any `@Nullable` annotation by simple name |
| Java Required | Custom required check | Fields without `@Nullable` are required |
| Agent Prompt | Add to Phase 4 | New "Mandatory Field Mapping" validation |
| Annotation Package | Package-agnostic | `getSimpleName().equals("Nullable")` |
