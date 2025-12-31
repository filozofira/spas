# Data Model: Java SDK Optional Path Attribute

**Feature**: 027-java-optional-path  
**Phase**: 1 (Design)  
**Date**: 2025-12-31

## Overview

This feature modifies existing annotation definitions. No new entities are introduced.

## Entity Changes

### @SpasCommand Annotation

**Location**: `components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/annotations/SpasCommand.java`

**Current Definition**:
```java
String path();  // Required - no default value
```

**New Definition**:
```java
/**
 * HTTP route path (e.g., "/api/orders") or gRPC method path.
 * Optional when using Spring annotations (@RequestMapping, @PostMapping, etc.)
 * which will be used to infer the path at runtime.
 * Required when compile-time generation is enabled (-Aspas.generateSpasJson=true).
 */
String path() default "";
```

**Validation Rules**:
- Empty string = "not specified" (triggers inference)
- Non-empty string = explicit path (takes precedence)
- When compile-time generation enabled AND path empty → compile error

---

### @SpasQuery Annotation

**Location**: `components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/annotations/SpasQuery.java`

**Current Definition**:
```java
String path();  // Required - no default value
```

**New Definition**:
```java
/**
 * HTTP route path (e.g., "/api/orders/{id}") or gRPC method path.
 * Optional when using Spring annotations (@RequestMapping, @GetMapping, etc.)
 * which will be used to infer the path at runtime.
 * Required when compile-time generation is enabled (-Aspas.generateSpasJson=true).
 */
String path() default "";
```

**Validation Rules**:
- Same as @SpasCommand

---

## Behavioral Changes

### SpasAnnotationProcessor (Compile-Time)

**Location**: `components/sdk/java/spas-sdk-metadata-processor/src/main/java/io/spas/sdk/metadata/processor/SpasAnnotationProcessor.java`

**Current Behavior**:
- Uses `cmd.path()` directly without validation
- If path is empty, produces metadata with empty path

**New Behavior**:
- When `-Aspas.generateSpasJson=true` is set:
  - Check if `path` is empty or blank
  - If empty, emit compile error with message:
    ```
    @SpasCommand 'CommandName' requires explicit 'path' attribute when compile-time 
    generation is enabled. Path inference from Spring annotations is only available 
    at runtime via --generate-metadata.
    ```
- When `-Aspas.generateSpasJson=true` is NOT set:
  - No validation (runtime will handle inference)

---

### SpasMetadataArchiveGenerator (Runtime)

**Location**: `components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasMetadataArchiveGenerator.java`

**Current Behavior**:
- Infers path from Spring annotations
- Falls back to explicit `cmd.path()` if inference fails

**New Behavior**:
- Same inference logic (no change)
- When both inferred path AND explicit path are empty/null:
  - Emit warning log: `"Skipping endpoint 'CommandName': no path could be inferred from Spring annotations and no explicit path provided"`
  - Skip the endpoint (do not add to metadata)

---

## State Transitions

```
Annotation Processing Flow
==========================

Compile-Time (SpasAnnotationProcessor)
├── -Aspas.generateSpasJson=true?
│   ├── YES: path empty?
│   │   ├── YES → ERROR: "explicit path required"
│   │   └── NO  → Generate spas.json with explicit path
│   └── NO: Skip processing (runtime will handle)

Runtime (SpasMetadataArchiveGenerator with --generate-metadata)
├── Scan @SpasCommand/@SpasQuery annotations
├── Extract Spring annotation paths (@RequestMapping + @PostMapping/etc.)
├── methodPath = combinePaths(classPath, methodPath)
├── finalPath = methodPath != null ? methodPath : annotation.path()
├── finalPath empty?
│   ├── YES → WARN + skip endpoint
│   └── NO  → Add to EndpointContract
```

---

## Constraints

1. **Java Annotation Semantics**: Default values in annotations must be compile-time constants
2. **Backward Compatibility**: Existing code with explicit `path` must continue to work unchanged
3. **Compile-Time Limitation**: Spring annotations cannot be fully resolved at compile time
4. **Empty String Convention**: Empty string (`""`) means "not specified" (standard Java annotation pattern)

---

## Relationships

```
@SpasCommand / @SpasQuery
    │
    ├── [Compile-Time] SpasAnnotationProcessor
    │       └── Validates path when generation enabled
    │
    └── [Runtime] SpasMetadataArchiveGenerator
            ├── Reads Spring annotations (@RequestMapping, @PostMapping, etc.)
            ├── Combines class-level + method-level paths
            └── Falls back to annotation path() if inference fails
```
