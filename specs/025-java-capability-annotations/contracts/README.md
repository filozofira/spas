# Contracts: Java Capability Annotations Guidance

**Feature**: 025-java-capability-annotations  
**Created**: 2025-12-30  
**Purpose**: Document contract changes for deprecated SDK methods and CLI template outputs.

## Overview

This feature does not introduce new REST/gRPC APIs or event schemas. Instead, it modifies:
1. **SDK Method Signatures** (deprecation annotations)
2. **CLI Template Outputs** (generated agent instruction content)

This file documents the "contract" between:
- SDK and service developers (deprecation timeline, replacement APIs)
- CLI and workspace consumers (template content guarantees)

---

## SDK Deprecation Contracts

### 1. SpasServiceOptions.addCapability()

**Location**: `components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasServiceOptions.java`

**Current Signature**:
```java
public void addCapability(String capability)
```

**Deprecated Signature** (v1.1.0):
```java
/**
 * Adds a capability to the service metadata.
 * 
 * @param capability the capability identifier (e.g., "order-management")
 * @deprecated Use {@link io.spas.sdk.metadata.annotations.SpasCommand},
 *             {@link io.spas.sdk.metadata.annotations.SpasQuery}, or
 *             {@link io.spas.sdk.metadata.annotations.SpasEvent} annotations
 *             on handler methods instead. Capabilities are automatically
 *             discovered from annotated methods.
 *             This method will be removed in version 2.0.0.
 * @see io.spas.sdk.metadata.annotations.SpasCommand
 * @see io.spas.sdk.metadata.annotations.SpasQuery
 * @see io.spas.sdk.metadata.annotations.SpasEvent
 */
@Deprecated(since = "1.1.0", forRemoval = true)
public void addCapability(String capability)
```

**Removal Version**: 2.0.0

**Migration Path**:
```java
// BEFORE (v1.0.x):
SpasServiceRunner.run(Application.class, args, options -> {
    options.addCapability("order-management");
});

// AFTER (v1.1.0+):
// Capabilities auto-discovered from annotations:
@SpasCommand(name = "CreateOrder", version = "1.0.0")
public OrderResponse createOrder(@RequestBody CreateOrderRequest request) {
    // Implementation
}
```

**Breaking Change Schedule**:
- **v1.1.0**: Method deprecated, warnings emitted during compilation
- **v1.2.0 - v1.x**: Method remains available (deprecated)
- **v2.0.0**: Method removed (compilation error if still referenced)

---

### 2. ServiceIdentityBuilder.addCapability()

**Location**: `components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/builders/ServiceIdentityBuilder.java`

**Current Signature**:
```java
public ServiceIdentityBuilder addCapability(String capability)
```

**Deprecated Signature** (v1.1.0):
```java
/**
 * Adds a capability to the service identity.
 * 
 * @param capability the capability identifier (e.g., "order-management")
 * @return this builder for method chaining
 * @deprecated Capabilities are automatically discovered from
 *             {@link io.spas.sdk.metadata.annotations.SpasCommand},
 *             {@link io.spas.sdk.metadata.annotations.SpasQuery}, and
 *             {@link io.spas.sdk.metadata.annotations.SpasEvent} annotations.
 *             Manual capability registration is no longer necessary.
 *             This method will be removed in version 2.0.0.
 * @see io.spas.sdk.metadata.annotations.SpasCommand
 * @see io.spas.sdk.metadata.annotations.SpasQuery
 * @see io.spas.sdk.metadata.annotations.SpasEvent
 */
@Deprecated(since = "1.1.0", forRemoval = true)
public ServiceIdentityBuilder addCapability(String capability)
```

**Removal Version**: 2.0.0

**Migration Path**:
```java
// BEFORE (v1.0.x):
ServiceIdentity identity = ServiceIdentityBuilder.create()
    .withName("order-service")
    .withVersion("1.0.0")
    .withBoundedContext("orders")
    .addCapability("order-management")
    .build();

// AFTER (v1.1.0+):
// Builder still valid; omit addCapability():
ServiceIdentity identity = ServiceIdentityBuilder.create()
    .withName("order-service")
    .withVersion("1.0.0")
    .withBoundedContext("orders")
    .build();

// Capabilities discovered separately from annotations
```

**Breaking Change Schedule**:
- **v1.1.0**: Method deprecated, warnings emitted
- **v1.2.0 - v1.x**: Method remains available (deprecated)
- **v2.0.0**: Method removed

---

## CLI Template Output Contracts

### 3. Generated Agent Instructions (Java)

**Template**: `components/cli/spas-service/templates/partials/sdk-patterns.eta`

**Contract**: When `STACK:java`, the generated agent file MUST NOT contain `addCapability()` examples.

**Current Output** (v1.0.x):
````markdown
```java
public static void main(String[] args) {
    SpasServiceRunner.run(Application.class, args, options -> {
        options.addCapability("{primary-capability}");  // ❌ Deprecated pattern
        options.setConsistency(...);
    });
}
```
````

**New Output** (v1.1.0+):
````markdown
```java
public static void main(String[] args) {
    SpasServiceRunner.run(Application.class, args, options -> {
        // Capabilities are auto-discovered from @SpasCommand, @SpasQuery,
        // and @SpasEvent annotations on your handler methods.
        // No manual registration needed.
        
        options.setConsistency(new Consistency(ConsistencyLevel.ACID, QueryConsistencyLevel.EVENTUAL));
        options.setSecurity(...);
        options.setLicense("MIT");
    });
}
```
````

**Validation**:
- Generated file MUST NOT match regex: `options\.addCapability\(`
- Generated file MUST include comment explaining auto-discovery

---

### 4. Phase 3 Workflow Guidance (Java)

**Template**: `components/cli/spas-service/templates/partials/workflow-phases.eta`

**Contract**: Phase 3 guidance MUST reference annotation-based capability declaration.

**Current Guidance** (v1.0.x):
```text
Phase 3 Exit Criteria:
- At least one capability added via `AddCapability()` or `addCapability()`
```

**New Guidance** (v1.1.0+):
```text
Phase 3 Exit Criteria:
- Service identity configured via @SpasService annotation on Application class
- At least one command, query, or event handler annotated with @SpasCommand,
  @SpasQuery, or @SpasEvent (capabilities auto-discovered from these annotations)
- SpasServiceRunner.run() used to bootstrap the application
```

**Validation**:
- Guidance MUST NOT mention `addCapability()` method
- Guidance MUST reference at least one capability annotation (`@SpasCommand`, `@SpasQuery`, or `@SpasEvent`)

---

### 5. Non-Java Templates (Unchanged)

**Contract**: Templates for `.NET` (`STACK:dotnet`) MUST remain unchanged.

**Validation**:
- Git diff on `.eta` files MUST show changes only in Java-specific sections
- .NET code blocks (identified by `STACK:dotnet` or `#if (it.stack === 'dotnet')`) MUST be byte-identical to v1.0.x

---

## Backward Compatibility Guarantees

### Services Using v1.0.x SDK

**Behavior with v1.1.0+ CLI**:
- Existing services with `addCapability()` calls continue to work
- Compilation emits deprecation warnings
- Runtime behavior unchanged (method still functional)
- No forced migration required

**Behavior with v2.0.0 SDK**:
- Compilation fails if `addCapability()` is still referenced
- Developer MUST migrate to annotations before upgrading to v2.0.0

---

### CLI Generated Workspaces

**v1.0.x CLI → v1.1.0+ SDK**:
- Old scaffolds with `addCapability()` receive deprecation warnings
- Services remain functional

**v1.1.0+ CLI → v1.0.x SDK**:
- New scaffolds without `addCapability()` work with v1.0.x SDK
- Auto-discovery of capabilities may not work (SDK must support annotation scanning)
- **Recommendation**: Use CLI version matching SDK major version

---

## Contract Verification

### Automated Checks

1. **CLI Template Linting**:
   ```bash
   # Ensure no addCapability() in Java sections
   grep -n "addCapability" components/cli/spas-service/templates/partials/*.eta | grep -v "# .NET"
   # Should return zero matches in Java sections
   ```

2. **SDK Deprecation Annotation**:
   ```bash
   # Verify @Deprecated present with forRemoval=true
   grep -A 5 "@Deprecated" components/sdk/java/spas-sdk-*/src/main/java/**/*.java | grep "forRemoval = true"
   ```

3. **Documentation Migration Notes**:
   ```bash
   # Ensure README includes migration guidance
   grep -n "Migration Note" components/sdk/java/*/README.md
   ```

### Manual Verification

1. Run `spas-service init test-service` with Java stack
2. Inspect generated `.github/agents/spas.service.agent.md`
3. Confirm no `addCapability()` references in Java examples
4. Confirm Phase 3 guidance mentions annotations

---

## Summary

This feature modifies the "contracts" between:
- **SDK ↔ Service Developers**: Deprecation annotations signal API lifecycle; Javadoc provides migration path
- **CLI ↔ Workspace Consumers**: Generated templates guarantee best-practice patterns; no deprecated examples

All contract changes are backward-compatible through v1.x releases. Breaking removal occurs only in v2.0.0 major version bump.
