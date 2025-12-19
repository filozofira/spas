# Quickstart: Java SPAS SDK

**Feature**: 016-java-spas-sdk  
**Date**: 2025-12-19  
**Phase**: 1 - Design & Contracts

## Prerequisites

- Java 17 or later
- Maven 3.8 or later
- (Optional) Spring Boot 3.x for auto-configuration

## Installation

Add the SPAS SDK dependencies to your `pom.xml`:

```xml
<dependencies>
    <!-- Core: Context and utilities -->
    <dependency>
        <groupId>io.spas</groupId>
        <artifactId>spas-sdk-core</artifactId>
        <version>1.0.0</version>
    </dependency>
    
    <!-- Metadata: Annotations and builders -->
    <dependency>
        <groupId>io.spas</groupId>
        <artifactId>spas-sdk-metadata</artifactId>
        <version>1.0.0</version>
    </dependency>
    
    <!-- Events: Event publishing -->
    <dependency>
        <groupId>io.spas</groupId>
        <artifactId>spas-sdk-events</artifactId>
        <version>1.0.0</version>
    </dependency>
    
    <!-- Spring: Auto-configuration (optional) -->
    <dependency>
        <groupId>io.spas</groupId>
        <artifactId>spas-sdk-spring</artifactId>
        <version>1.0.0</version>
    </dependency>
</dependencies>
```

Configure the annotation processor:

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.12.1</version>
            <configuration>
                <annotationProcessorPaths>
                    <path>
                        <groupId>io.spas</groupId>
                        <artifactId>spas-sdk-metadata-processor</artifactId>
                        <version>1.0.0</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>
```

## Minimal Spring Boot Example

### 1. Application Configuration

```yaml
# application.yml
spas:
  service-name: order-service
  sidecar:
    url: http://localhost:8081  # or use host/port
```

### 2. Define an Event

```java
package com.example.orders.events;

import io.spas.sdk.metadata.annotations.SpasEvent;

@SpasEvent(value = "OrderCreated", version = "1.0")
public record OrderCreatedEvent(
    String orderId,
    String customerId,
    BigDecimal total
) {}
```

### 3. Create a Controller with Commands

```java
package com.example.orders.api;

import io.spas.sdk.metadata.annotations.SpasCommand;
import io.spas.sdk.events.EventPublisher;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final EventPublisher eventPublisher;
    
    public OrderController(EventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @SpasCommand(value = "CreateOrder", version = "1.0")
    @PostMapping
    public OrderResponse createOrder(@RequestBody CreateOrderRequest request) {
        // Business logic...
        String orderId = UUID.randomUUID().toString();
        
        // Publish event (trace context automatically propagated)
        eventPublisher.publishAsync(new OrderCreatedEvent(
            orderId,
            request.customerId(),
            request.total()
        ));
        
        return new OrderResponse(orderId, "CREATED");
    }
    
    @SpasQuery(value = "GetOrder", version = "1.0")
    @GetMapping("/{orderId}")
    public OrderResponse getOrder(@PathVariable String orderId) {
        // Query logic...
        return new OrderResponse(orderId, "ACTIVE");
    }
}
```

### 4. Enable SPAS (optional - auto-detected)

```java
package com.example.orders;

import io.spas.sdk.spring.EnableSpas;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableSpas  // Optional: auto-configuration is enabled by default
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}
```

## Build and Verify

```bash
# Build the project
mvn clean compile

# Verify spas.json was generated
cat target/classes/spas.json
```

Expected output:

```json
{
  "schemaVersion": "design-time-metadata-v1",
  "id": "order-service",
  "name": "Order Service",
  "version": "1.0.0",
  "boundedContext": "orders",
  "endpoints": [
    {
      "name": "create-order",
      "type": "Command",
      "protocol": "Http",
      "methodPath": "POST /api/orders",
      "version": "1.0",
      "schemaRef": ""
    },
    {
      "name": "get-order",
      "type": "Query",
      "protocol": "Http",
      "methodPath": "GET /api/orders/{orderId}",
      "version": "1.0",
      "schemaRef": ""
    }
  ],
  "events": [
    {
      "type": "order-created",
      "version": "1.0",
      "schemaRef": ""
    }
  ]
}
```

## Using Builders (Advanced)

For programmatic metadata composition:

```java
import io.spas.sdk.metadata.builders.*;
import io.spas.sdk.metadata.model.*;

ServiceIdentity identity = ServiceIdentityBuilder.create()
    .withId("order-service")
    .withName("Order Service")
    .withVersion("1.0.0")
    .withBoundedContext("orders")
    .addCapability("order-management")
    .build();

Security security = SecurityBuilder.create()
    .withAuthenticationType(AuthType.JWT)
    .addDataClassification(DataClassification.CONFIDENTIAL)
    .build();

Consistency consistency = ConsistencyBuilder.create()
    .withCommands(ConsistencyLevel.ACID)
    .withQueries(QueryConsistencyLevel.EVENTUAL)
    .build();

ServiceMetadata metadata = MetadataComposer.create()
    .withIdentity(identity)
    .withSecurity(security)
    .withConsistency(consistency)
    .compose();
```

## Accessing Context

```java
import io.spas.sdk.core.context.SpasContext;
import io.spas.sdk.core.context.SpasTrace;

// In any request handler
SpasContext context = SpasContext.current();
String correlationId = context.getCorrelationId();
Optional<String> userId = context.getUserId();

SpasTrace trace = SpasTrace.current();
String traceId = trace.getTraceId();
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| SERVICE_NAME | Yes* | Service identifier (*or use spas.service-name) |
| SIDECAR_URL | No | Full sidecar URL (e.g., http://order-service-sidecar:8081) |
| SIDECAR_HOST | No | Sidecar hostname (default: {service-name}-sidecar) |
| SIDECAR_PORT | No | Sidecar port (default: 8081) |

## Next Steps

- [API Contracts](contracts/api-contracts.md) - Full API reference
- [Data Model](data-model.md) - Entity definitions
- [Research](research.md) - Technology decisions
