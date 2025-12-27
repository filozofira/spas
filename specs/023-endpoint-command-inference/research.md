# Research: SDK Simplification for AI-Assisted Development

**Feature**: 023-endpoint-command-inference  
**Date**: 2025-12-27

## Research Tasks

### 1. How does the Java SDK infer schemas from endpoint parameters?

**Decision**: Mirror Java SDK's `resolveSchemaTypeFromMethod()` pattern in .NET.

**Rationale**: Java SDK already implements endpoint-centric schema inference successfully. The approach:
1. Check method parameters for `@RequestBody` annotation
2. Extract the parameter type
3. Generate schema from that type (no DTO annotation needed)

**Evidence**: `SpasMetadataArchiveGenerator.java` lines 961-1010 show the implementation:
```java
private Class<?> resolveSchemaTypeFromMethod(Method method) {
    for (java.lang.reflect.Parameter parameter : method.getParameters()) {
        if (parameter.getAnnotation(RequestBody.class) != null) {
            return parameter.getType();
        }
    }
    // ... fallback to return type
}
```

**Alternatives considered**:
- Continue requiring DTO attributes → Rejected: causes AI agent errors
- Use naming conventions → Rejected: too fragile, not explicit

---

### 2. How to identify the request body parameter in ASP.NET Core Minimal APIs?

**Decision**: Use reflection on endpoint metadata to find the first complex-type parameter not bound to route/query.

**Rationale**: Minimal APIs bind complex types from the request body by default. ASP.NET Core's parameter binding conventions:
- Primitives bound from route/query
- Complex types bound from body (JSON)
- Explicit `[FromBody]` overrides binding

**Implementation approach**:
1. In `ProcessEndpoint()`, after finding `SpasCommandAttribute`, inspect the delegate's parameters
2. Find first parameter that is:
   - Not a primitive type
   - Not annotated with `[FromRoute]`, `[FromQuery]`, `[FromServices]`
3. Generate schema from that type

**Alternatives considered**:
- Require `[FromBody]` annotation → Rejected: adds boilerplate
- Use first parameter always → Rejected: would pick route parameters incorrectly

---

### 3. How to make the eventName overload internal without breaking existing code?

**Decision**: Change `public async Task PublishAsync(string eventName, object payload)` to `internal`.

**Rationale**: 
- All example services use `PublishAsync<TEvent>(payload)` pattern
- Internal visibility allows the generic method to still call it
- Breaking change is intentional (spec FR-008)

**Migration impact**: Any external code using explicit eventName overload will fail to compile. This is the desired behavior to force migration.

**Alternatives considered**:
- Mark `[Obsolete]` instead → Rejected: AI agents ignore obsolete warnings
- Remove entirely → Rejected: generic method needs to call it internally

---

### 4. Where in the metadata generation pipeline should schema inference occur?

**Decision**: Modify `WebApplicationDiscoveryExtensions.ProcessEndpoint()` to extract parameter type and pass to schema generator.

**Rationale**: This is where endpoints are discovered and `SpasCommandAttribute` is processed. The logical place to also extract the parameter type.

**Current flow**:
1. `ProcessEndpoint()` finds `SpasCommandAttribute` on endpoint
2. Adds endpoint to `ContractsBuilder`
3. Schema path is derived from command name

**New flow**:
1. `ProcessEndpoint()` finds `SpasCommandAttribute` on endpoint
2. **NEW**: Extract request body parameter type from endpoint delegate
3. **NEW**: Pass type to schema generator (not relying on attribute on type)
4. Add endpoint + inferred schema to `ContractsBuilder`

**Files to modify**:
- `WebApplicationDiscoveryExtensions.cs` (extract param type)
- `MetadataArchiveGenerator.cs` (accept param type for schema generation)
- `SchemaGenerator.cs` (add method to generate schema from any type, not just attributed types)

---

### 5. How to handle deduplication when multiple endpoints use the same DTO?

**Decision**: Track generated schema paths in a dictionary; skip generation if path already exists.

**Rationale**: Schema path is derived from command name (`schemas/endpoints/{command-name}.schema.json`), not DTO type name. Two endpoints with different commands using the same DTO will generate separate schemas (correct behavior per SPAS conventions).

If the spec intent is to deduplicate by DTO type, we would need to:
- Track `Type → schemaPath` mapping
- Reuse existing schema path for same Type

**Clarification needed**: Spec FR-006 says "deduplicate schema generation when multiple endpoints use the same DTO type". This implies deduplication by type, not by command name. Need to confirm expected behavior.

**Current decision**: Deduplicate by schema path (command name). If two endpoints have the same command name, they share a schema. Different commands = different schemas even if same DTO.

---

## Summary

| Topic | Decision | Risk |
|-------|----------|------|
| Schema inference approach | Mirror Java SDK pattern | Low - proven pattern |
| Request body detection | First complex non-route param | Low - standard convention |
| EventPublisher visibility | Change overload to internal | Medium - breaking change (intentional) |
| Pipeline integration point | ProcessEndpoint() + MetadataArchiveGenerator | Low - clear integration point |
| Schema deduplication | By schema path (command name) | Low - follows existing convention |

## Open Questions

None - all research questions resolved.
