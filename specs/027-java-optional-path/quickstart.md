# Quickstart: Java SDK Optional Path Attribute

**Feature**: 027-java-optional-path  
**Date**: 2025-12-31

## Overview

This guide shows how to use `@SpasCommand` and `@SpasQuery` annotations without the redundant `path` attribute when using Spring Boot controllers.

## Before & After

### Before (Redundant Path)

```java
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @SpasCommand(
        name = "CreateOrder",
        version = "1.0.0",
        path = "/api/orders",  // ❌ Redundant!
        description = "Creates a new order"
    )
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody CreateOrderRequest request) {
        // ...
    }

    @SpasQuery(
        name = "GetOrder",
        version = "1.0.0",
        path = "/api/orders/{id}",  // ❌ Redundant!
        description = "Gets order by ID"
    )
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable String id) {
        // ...
    }
}
```

### After (Path Inferred from Spring Annotations)

```java
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @SpasCommand(
        name = "CreateOrder",
        version = "1.0.0",
        description = "Creates a new order"
    )
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody CreateOrderRequest request) {
        // Path automatically inferred as /api/orders
    }

    @SpasQuery(
        name = "GetOrder",
        version = "1.0.0",
        description = "Gets order by ID"
    )
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable String id) {
        // Path automatically inferred as /api/orders/{id}
    }
}
```

## How Path Inference Works

The runtime metadata generator (`--generate-metadata`) infers paths by combining:

1. **Class-level** `@RequestMapping("/api/orders")`
2. **Method-level** `@PostMapping`, `@GetMapping("/{id}")`, etc.

| Class Path | Method Path | Result |
|------------|-------------|--------|
| `/api/orders` | (none) | `/api/orders` |
| `/api/orders` | `/{id}` | `/api/orders/{id}` |
| `/api/orders` | `/batch` | `/api/orders/batch` |
| (none) | `/api/direct` | `/api/direct` |

## Generating Metadata

Use the standard runtime metadata generation:

```bash
# Build the service
mvn package

# Generate metadata
java -jar target/my-service.jar --generate-metadata --output ./metadata
```

The generated `service.metadata.zip` will contain correct paths inferred from Spring annotations.

## When to Use Explicit Path

You may still specify `path` explicitly when:

1. **Path differs from Spring annotation** (rare, not recommended)
2. **No Spring annotation present** (non-controller use cases)
3. **Compile-time generation** is explicitly enabled

```java
// Explicit path when Spring annotation absent
@SpasCommand(
    name = "ProcessEvent",
    version = "1.0.0",
    path = "/internal/process"  // Required - no Spring annotation
)
public void processEvent(EventPayload payload) {
    // Called by sidecar, not via REST
}
```

## Compile-Time Generation Note

If you enable compile-time generation via `-Aspas.generateSpasJson=true`:

```xml
<plugin>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <compilerArgs>
            <arg>-Aspas.generateSpasJson=true</arg>
        </compilerArgs>
    </configuration>
</plugin>
```

You **must** provide explicit `path` attributes because the compile-time processor cannot infer paths from Spring annotations. A compile error will be emitted if path is missing.

**Recommendation**: Use runtime generation (`--generate-metadata`) for Spring Boot services.

## Validation

After updating your code, verify the generated metadata:

```bash
# Generate metadata
java -jar target/my-service.jar --generate-metadata --output ./metadata

# Check the paths in spas.json
unzip -p ./metadata/service.metadata.zip spas.json | jq '.endpoints'
```

Expected output:
```json
[
  {
    "name": "create-order",
    "type": "Command",
    "protocol": "Http",
    "methodPath": "/api/orders",
    "version": "1.0.0"
  },
  {
    "name": "get-order",
    "type": "Query",
    "protocol": "Http",
    "methodPath": "/api/orders/{id}",
    "version": "1.0.0"
  }
]
```
