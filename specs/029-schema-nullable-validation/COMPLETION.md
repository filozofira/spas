# Completion Report: Schema Nullable Handling and Transformation Validation

**Branch**: `029-schema-nullable-validation` | **Date**: 2026-01-02

## Summary

Successfully implemented JSON Schema `required` array generation for non-nullable properties and nullable type representation across Java and .NET SDKs. Updated `spas-compose init` to generate agent prompts with mandatory field mapping validation in Phase 4.

## Delivered Features

### 1. .NET SDK (NJsonSchema)
- **Required Array**:
  - Configured `NewtonsoftJsonSchemaGeneratorSettings` with `DefaultReferenceTypeNullHandling.NotNull`.
  - Added `AddRequiredArrayFromNonNullableProperties()` post-processing to compute `required` array.
  - Properties without nullable type syntax are included in `required`.
- **Nullable Types**:
  - Nullable properties (e.g., `string?`) generate `"type": ["string", "null"]`.
  - Non-nullable properties use single type (e.g., `"type": "string"`).
- **Dependencies**:
  - Added `NJsonSchema.NewtonsoftJson` 11.5.2 for proper nullability handling.
  - Upgraded `NJsonSchema` to 11.5.2.

### 2. Java SDK (victools/jsonschema-generator)
- **Required Array**:
  - Added `withRequiredCheck()` to mark non-nullable fields as required.
  - Fields without `@Nullable` annotation are included in `required`.
- **Nullable Types**:
  - Added `withNullableCheck()` to detect `@Nullable` annotations.
  - Package-agnostic detection via `annotation.annotationType().getSimpleName().equals("Nullable")`.
  - Supports `org.jetbrains.annotations.Nullable`, `jakarta.annotation.Nullable`, `javax.annotation.Nullable`, etc.
- **Documentation**:
  - Added "Nullable Fields in DTOs" section to Java SDK README.
  - Documents @Nullable usage and supported annotation packages.

### 3. CLI (spas-compose)
- **Agent Prompt Update**:
  - Added "Mandatory Field Mapping Validation (CRITICAL)" action to Phase 4 (Validate).
  - Instructs agent to read target schema's `required` array.
  - Instructs agent to verify all required fields are mapped in transformations.
  - Provides example error format for missing field reporting.
- **Validation Checklist**:
  - Added checklist item: "All required fields from target schemas are mapped in transformations".

### 4. CLI (spas-service)
- **Agent Prompt Update**:
  - Added "Request/Response DTOs with Nullable Fields" section to Java SDK patterns.
  - Added "DTOs with Nullable Fields" section to .NET SDK patterns.
  - Documents `@Nullable` usage for Java with `jakarta.annotation.Nullable`.
  - Documents `?` nullable syntax for C# with `<Nullable>enable</Nullable>`.
  - Explains SDK schema generator behavior for required array and nullable types.

### 5. Example Service
- **CreateShipmentRequest.java**:
  - Updated with `@Nullable` annotations demonstrating required vs optional fields.
  - Added `specialInstructions` field as nullable example.
  - Added JetBrains annotations dependency to pom.xml.

## Files Changed

| Component | File | Change |
|-----------|------|--------|
| .NET SDK | `components/sdk/dotnet/src/Spas.Sdk.Metadata/Schema/SchemaGenerator.cs` | NewtonsoftJsonSchemaGeneratorSettings, AddRequiredArrayFromNonNullableProperties() |
| .NET SDK | `components/sdk/dotnet/src/Spas.Sdk.Metadata/Spas.Sdk.Metadata.csproj` | Added NJsonSchema.NewtonsoftJson 11.5.2 |
| .NET SDK | `components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/SchemaGeneratorTests.cs` | Added NullableTestDto and test |
| .NET SDK | `components/sdk/dotnet/README.md` | Added "Nullable Fields in DTOs" section |
| Java SDK | `components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasSchemaGenerator.java` | withNullableCheck(), withRequiredCheck(), hasNullableAnnotation() |
| Java SDK | `components/sdk/java/spas-sdk-spring/src/test/java/io/spas/sdk/spring/SpasSchemaGeneratorTest.java` | New file with 5 tests |
| Java SDK | `components/sdk/java/README.md` | Added "Nullable Fields in DTOs" section |
| CLI | `components/cli/spas-compose/src/templates/partials/workflow-phases.eta` | Phase 4 mandatory field validation |
| CLI | `components/cli/spas-compose/test/unit/utils/templates.test.ts` | Test for mandatory field validation |
| CLI | `components/cli/spas-service/templates/partials/sdk-patterns.eta` | Java and .NET nullable field guidance |
| Example | `examples/services/fulfillment-service/src/main/java/.../dto/CreateShipmentRequest.java` | @Nullable annotations |
| Example | `examples/services/fulfillment-service/pom.xml` | JetBrains annotations dependency |
| SDK | `components/sdk/CONVENTIONS.md` | Added "Adapt, Don't Invent" section |

## Verification

- **Tests**:
  - .NET SDK: 146/146 tests pass (including new required/nullable tests).
  - Java SDK: All tests pass (including 5 new SpasSchemaGeneratorTest tests).
  - CLI: 16 workflow tests pass (including mandatory field validation test).
- **Schema Compliance**: Verified JSON Schema draft-07 `$schema` is set correctly in both SDKs.
- **Documentation**: README sections added for both SDKs explaining nullable handling.

## Key Design Decisions

1. **C# Nullable Reference Types over Attributes**: Used C#'s built-in `string?` syntax rather than introducing `[Required]` attributes (follows "Adapt, Don't Invent" principle).

2. **Package-Agnostic @Nullable Detection**: Java SDK detects any `@Nullable` annotation by simple name, supporting multiple annotation packages without explicit dependencies.

3. **Post-Processing Required Array**: .NET SDK computes `required` array by inspecting generated schema types rather than relying on NJsonSchema's incomplete required handling.

## Next Steps

- **Runtime Validation**: Consider adding sidecar-level validation that checks incoming payloads against `required` arrays.
- **IDE Support**: Document how to configure IDE warnings for missing @Nullable annotations in Java.
- **E2E Testing**: Validate agent correctly identifies missing required fields in transformations during choreography workflow.
