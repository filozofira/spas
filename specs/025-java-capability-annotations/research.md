# Research: Java Capability Annotations Guidance

**Feature**: 025-java-capability-annotations  
**Created**: 2025-12-30  
**Purpose**: Resolve all [NEEDS CLARIFICATION] markers from Technical Context and research best practices for deprecation, template updates, and SDK guidance.

## Research Questions

### Q1: Current State of Java SDK Capability Declaration

**Investigation**: What mechanisms exist in the Java SDK for declaring capabilities?

**Findings**:
1. **Annotation-based (Canonical)**: 
   - `@SpasCommand`, `@SpasQuery`, `@SpasEvent` annotations on handler methods
   - Metadata extractor scans classpath at runtime/build-time to discover capabilities
   - Example: `@SpasCommand(name = "CreateOrder")` on `createOrder()` method
   - Location: `components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/annotations/`

2. **Programmatic (To Be Deprecated)**:
   - `SpasServiceOptions.addCapability(String)` in Spring integration
   - `ServiceIdentityBuilder.addCapability(String)` in metadata builder
   - Used in `SpasServiceRunner.run()` lambda or builder pattern
   - Location: 
     - `components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasServiceOptions.java` (line 77)
     - `components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/builders/ServiceIdentityBuilder.java` (line 49)

**Decision**: Deprecate programmatic methods; promote annotation-based approach as the sole canonical pattern.

**Rationale**: 
- Annotations align with declarative metadata model
- Enable compile-time validation and IDE support
- Consistent with Spring Boot and Jakarta EE conventions
- Reduce boilerplate and improve readability

**Alternatives Considered**:
- Keep both approaches: Rejected — creates confusion and mixed patterns
- Remove immediately without deprecation: Rejected — violates clarification decision (one minor version window)

---

### Q2: Deprecation Strategy for Java SDK Methods

**Investigation**: How should `addCapability()` be deprecated in Java SDK?

**Findings**:

**Standard Java Deprecation Pattern**:
```java
/**
 * @deprecated Use {@link io.spas.sdk.metadata.annotations.SpasCommand},
 * {@link io.spas.sdk.metadata.annotations.SpasQuery}, or
 * {@link io.spas.sdk.metadata.annotations.SpasEvent} annotations on handler methods instead.
 * This method will be removed in version 2.0.0.
 */
@Deprecated(since = "1.1.0", forRemoval = true)
public void addCapability(String capability) {
    // existing implementation
}
```

**Compiler Warnings**:
- `-Xlint:deprecation` Maven/Gradle flag enables detailed warnings
- IDE (IntelliJ, VS Code with Java extensions) will show strikethrough and tooltip

**Runtime Warnings (Optional Enhancement)**:
```java
@Deprecated(since = "1.1.0", forRemoval = true)
public void addCapability(String capability) {
    System.err.println("WARNING: addCapability() is deprecated. " +
        "Use @SpasCommand, @SpasQuery, or @SpasEvent annotations instead. " +
        "This method will be removed in version 2.0.0.");
    // existing implementation
}
```

**Decision**: 
- Use `@Deprecated(since = "1.1.0", forRemoval = true)` annotation
- Add clear Javadoc with links to replacement annotations
- Document removal version (2.0.0) in deprecation message
- Optional: Add runtime warning to stderr on first invocation (non-blocking)

**Rationale**:
- Standard Java practice (JEP 277: Enhanced Deprecation)
- IDE and compiler support out-of-the-box
- Clear migration path via Javadoc links

**Alternatives Considered**:
- Silent deprecation: Rejected — developers may miss the change
- Hard fail/exception: Rejected — breaks existing services immediately

---

### Q3: CLI Template Update Strategy

**Investigation**: How should CLI templates be updated to remove `addCapability()` references?

**Findings**:

**Files to Update**:
1. `components/cli/spas-service/templates/partials/sdk-patterns.eta` (line ~180-290)
   - Java `Application.main()` example with `SpasServiceRunner.run()`
   - Currently shows: `options.addCapability("{primary-capability}");`
   - **Change to**: Remove `addCapability()` entirely; add comment referencing annotations

2. `components/cli/spas-service/templates/partials/workflow-phases.eta` (lines ~248, 281, 304)
   - Phase 3 guidance for service identity configuration
   - Currently instructs: "Add capabilities via `addCapability()`"
   - **Change to**: "Declare capabilities via annotations on command/query handlers"

**Template Update Pattern** (for `sdk-patterns.eta`):
```java
// BEFORE (REMOVE):
public static void main(String[] args) {
    SpasServiceRunner.run(Application.class, args, options -> {
        options.addCapability("{primary-capability}");  // REMOVE THIS
        options.setConsistency(...);
    });
}

// AFTER (NEW GUIDANCE):
public static void main(String[] args) {
    SpasServiceRunner.run(Application.class, args, options -> {
        // Capabilities are auto-discovered from @SpasCommand, @SpasQuery, 
        // and @SpasEvent annotations on your handler methods.
        // No manual registration needed.
        
        options.setConsistency(...);
        options.setSecurity(...);
        options.setLicense("MIT");
    });
}
```

**Template Update Pattern** (for `workflow-phases.eta`):
```text
// BEFORE (REMOVE):
Phase 3 Exit Criteria:
- At least one capability added via `AddCapability()` or `addCapability()`

// AFTER (NEW GUIDANCE):
Phase 3 Exit Criteria:
- Service identity configured via @SpasService annotation
- At least one command, query, or event handler annotated with 
  @SpasCommand, @SpasQuery, or @SpasEvent (capabilities auto-discovered)
```

**Decision**:
- Remove all `addCapability()` examples from CLI templates
- Add inline comments explaining capability auto-discovery from annotations
- Update Phase 3 guidance to reference annotation-based approach
- Preserve non-Java language examples unchanged (per FR-007 scope)

**Rationale**:
- Prevents incorrect patterns from being scaffolded
- Aligns generated code with SDK best practices
- Reduces confusion for new developers

**Alternatives Considered**:
- Show both approaches: Rejected — perpetuates mixed patterns
- Add deprecation warning in template: Rejected — templates should show current best practice only

---

### Q4: SDK Documentation Updates

**Investigation**: What documentation needs to be updated?

**Findings**:

**Files to Update**:
1. `components/sdk/java/spas-sdk-metadata/README.md`
   - Add "Capability Declaration" section showing annotation approach
   - Example: "Use `@SpasCommand`, `@SpasQuery`, and `@SpasEvent` on handler methods"

2. `components/sdk/java/spas-sdk-spring/README.md`
   - Update "Configuration" section to remove `addCapability()` examples
   - Add note: "`addCapability()` is deprecated; use annotations instead"

3. `components/sdk/java/README.md` (root SDK README)
   - Ensure "Getting Started" section shows annotation-based approach
   - No references to programmatic capability registration

**Documentation Pattern**:
````markdown
## Declaring Capabilities

Capabilities are automatically discovered from annotations on your handler methods:

```java
@RestController
@RequestMapping("/orders")
public class OrderController {
    
    @SpasCommand(name = "CreateOrder", version = "1.0.0")
    @PostMapping
    public OrderResponse create(@RequestBody CreateOrderRequest request) {
        // Implementation
    }
    
    @SpasQuery(name = "GetOrder", version = "1.0.0")
    @GetMapping("/{id}")
    public OrderResponse getById(@PathVariable String id) {
        // Implementation
    }
}
```

The SDK metadata extractor will automatically register:
- `order-management` capability (derived from command/query presence)
- Command: `CreateOrder`
- Query: `GetOrder`

No manual capability registration is required.

### Migration Note

If your service uses `options.addCapability()`, replace it with annotations:

```java
// OLD (deprecated):
SpasServiceRunner.run(Application.class, args, options -> {
    options.addCapability("order-management");  // ❌ Deprecated
});

// NEW (recommended):
// Just annotate your handlers; capabilities auto-discovered
@SpasCommand(name = "CreateOrder", version = "1.0.0")
public OrderResponse create(...) { ... }
```

The `addCapability()` method is deprecated as of version 1.1.0 and will be removed in version 2.0.0.
````

**Decision**:
- Add "Capability Declaration" section to all three README files
- Include migration note showing before/after examples
- Reference annotation-based approach as the canonical pattern

**Rationale**:
- Provides clear, searchable guidance for developers
- Migration note enables quick transition for existing services
- Aligns with SC-003 (10-minute migration time)

**Alternatives Considered**:
- Separate migration guide: Rejected per clarification (no formal migration doc needed)
- Link to external docs: Rejected — keep guidance self-contained in SDK

---

## Technology Choices

### Deprecation Timeline

**Decision**: Deprecate in version 1.1.0, remove in version 2.0.0

**Rationale**:
- Follows semantic versioning (breaking change = major version bump)
- Provides one minor version window per clarification
- Clear communication via `@Deprecated(forRemoval = true)`

### Testing Strategy

**Decision**: Unit tests for template validation; no integration tests required for PoC

**Test Coverage**:
1. CLI: Validate generated templates contain no `addCapability()` references
2. CLI: Validate Java-specific templates updated; .NET templates unchanged
3. SDK: Existing unit tests for `SpasServiceOptions` and `ServiceIdentityBuilder` pass
4. SDK: Deprecation warnings visible in test output (manual verification)

**Rationale**:
- Template validation can be unit-tested (string matching)
- Deprecation warnings are compile-time; no runtime behavior changes
- Existing SDK tests ensure no functionality broken

---

## Best Practices

### Java Deprecation (JEP 277)

- Use `@Deprecated(since = "x.y.z", forRemoval = true)` for methods scheduled for removal
- Include detailed Javadoc with replacement guidance
- Use `@link` tags to reference replacement APIs
- Document removal version explicitly

### Template Maintenance

- Use inline comments to explain why code is structured a certain way
- Avoid showing deprecated patterns in generated code
- Keep language-specific sections clearly separated with comments

### Documentation

- "Migration Note" sections should be concise (single example, max 15 lines)
- Show before/after code side-by-side
- Include version numbers for deprecation and removal

---

## Summary

All technical unknowns resolved:

1. **Current State**: Java SDK has dual capability registration (annotations + programmatic)
2. **Deprecation**: Use `@Deprecated(since = "1.1.0", forRemoval = true)` with clear Javadoc
3. **CLI Templates**: Remove `addCapability()` examples; add comments explaining auto-discovery
4. **Documentation**: Add "Capability Declaration" sections; include concise migration notes

No further research or clarifications needed. Ready to proceed to Phase 1 (Design & Contracts).
