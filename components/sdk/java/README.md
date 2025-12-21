# SPAS SDK for Java

[![Java](https://img.shields.io/badge/Java-17+-orange)](https://openjdk.org/)
[![Maven](https://img.shields.io/badge/Maven-3.8+-blue)](https://maven.apache.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../../LICENSE)

The Java SDK for building **SPAS (Self-contained, Portable, Adaptable Services)** - services that publish rich metadata, communicate via events, and maintain distributed trace context.

## 🎯 Framework-Agnostic Design

> **Important**: The core SDK modules (`spas-sdk-core`, `spas-sdk-metadata`, `spas-sdk-events`) are **framework-agnostic** and work with any Java HTTP framework (JAX-RS, plain servlets, Micronaut, Quarkus, etc.).
>
> The `spas-sdk-spring` module is an **optional** integration that provides Spring Boot auto-configuration. You only need it if you're building Spring Boot applications.

## 📦 Modules

| Module | Description | Spring Required? |
|--------|-------------|------------------|
| `spas-sdk-core` | Context, configuration, utilities | ❌ No |
| `spas-sdk-metadata` | Annotations, builders, model classes | ❌ No |
| `spas-sdk-metadata-processor` | Compile-time `spas.json` generation | ❌ No |
| `spas-sdk-events` | Event publishing to sidecar | ❌ No |
| `spas-sdk-spring` | Spring Boot auto-configuration | ✅ Yes (optional) |

## ✨ Features

### 🎯 Metadata Generation
- **Annotation-based**: `@SpasCommand`, `@SpasQuery`, `@SpasEvent`
- **Compile-time generation**: `spas.json` created during Maven build
- **Schema validation**: Validates against design-time-metadata-v1 schema
- **Kebab-case normalization**: `OrderCreated` → `order-created`

### 📤 Event Publishing
- **Simple API**: `EventPublisher.publishAsync(event)`
- **Automatic headers**: traceparent, x-service-name, x-event-name, x-correlation-id
- **Sidecar integration**: Posts to sidecar `/publish` endpoint
- **No CloudEvents wrapping**: Sidecar handles envelope construction

### 📊 Context Propagation
- **W3C Trace Context**: Full traceparent/tracestate support
- **Identity propagation**: x-user-id, x-tenant-id headers
- **Thread-safe**: InheritableThreadLocal for async operations

## 🚀 Quick Start

### Installation

Add dependencies to your `pom.xml`:

Use a single property for the SDK version (set it to match `components/sdk/java/pom.xml`):

```xml
<properties>
    <spas.version></spas.version>
</properties>
```

```xml
<dependencies>
    <dependency>
        <groupId>io.spas</groupId>
        <artifactId>spas-sdk-core</artifactId>
        <version>${spas.version}</version>
    </dependency>
    <dependency>
        <groupId>io.spas</groupId>
        <artifactId>spas-sdk-metadata</artifactId>
        <version>${spas.version}</version>
    </dependency>
    <dependency>
        <groupId>io.spas</groupId>
        <artifactId>spas-sdk-events</artifactId>
        <version>${spas.version}</version>
    </dependency>
    <dependency>
        <groupId>io.spas</groupId>
        <artifactId>spas-sdk-spring</artifactId>
        <version>${spas.version}</version>
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
            <configuration>
                <annotationProcessorPaths>
                    <path>
                        <groupId>io.spas</groupId>
                        <artifactId>spas-sdk-metadata-processor</artifactId>
                        <version>${spas.version}</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>
```

### Define an Event

```java
import io.spas.sdk.metadata.annotations.SpasEvent;

@SpasEvent(value = "OrderCreated", version = "1.0",
    description = "Emitted after an order is successfully created and persisted")
public record OrderCreatedEvent(
    String orderId,
    String customerId,
    BigDecimal total
) {}
```

### Mark Endpoints

```java
import io.spas.sdk.metadata.annotations.SpasCommand;
import io.spas.sdk.metadata.annotations.SpasQuery;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @SpasCommand(value = "CreateOrder", version = "1.0",
        description = "Creates a new order and reserves inventory; returns the new orderId")
    @PostMapping
    public OrderResponse createOrder(@RequestBody CreateOrderRequest request) {
        // ...
    }
    
    @SpasQuery(value = "GetOrder", version = "1.0",
        description = "Returns current order state (status, items, totals) by orderId")
    @GetMapping("/{orderId}")
    public OrderResponse getOrder(@PathVariable String orderId) {
        // ...
    }
}
```

## ✍️ Writing Effective Descriptions

Descriptions are optional but strongly recommended for AI-assisted choreography.

**Rules**:
- Plain text only (no Markdown semantics)
- May include newlines
- Keep it intent-focused: purpose + key inputs + side effects

**Good examples**:
- Service: "Creates and tracks shipments for confirmed orders; publishes shipment lifecycle events"
- Command: "Creates a shipment for a confirmed order using destination address; emits ShipmentCreated"
- Query: "Returns shipment details by shipmentId"
- Event: "Emitted when shipment status changes; indicates progress through fulfillment lifecycle"

**Bad examples**:
- "CreateShipment" (just restates the name)
- "Does the thing" (too generic)
- "Creates a shipment (sometimes)" (ambiguous, no signal)

### Publish Events

```java
import io.spas.sdk.events.EventPublisher;

public class OrderService {
    private final EventPublisher eventPublisher;
    
    public void createOrder(CreateOrderRequest request) {
        // Business logic...
        
        // Publish event (headers automatically added)
        eventPublisher.publishAsync(new OrderCreatedEvent(
            orderId,
            request.customerId(),
            request.total()
        ));
    }
}
```

### Build and Verify

```bash
mvn clean compile
cat target/classes/spas.json
```

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SERVICE_NAME` | Yes | Service identifier (fails fast if missing) |
| `SIDECAR_URL` | No | Full sidecar URL (e.g., `http://localhost:7000`) |
| `SIDECAR_HOST` | No | Sidecar hostname (default: `{service-name}-sidecar`) |
| `SIDECAR_PORT` | No | Sidecar port (default: `7000`) |

### Spring Boot Properties (if using spas-sdk-spring)

```yaml
spas:
  service-name: order-service
  sidecar:
        url: http://localhost:7000
    connect-timeout: 5s
    request-timeout: 30s
```

## 📁 Project Structure

```
components/sdk/java/
├── pom.xml                        # Parent POM
├── README.md                      # This file
├── spas-sdk-core/                 # Core: context, config, utilities
├── spas-sdk-metadata/             # Annotations, builders, models
├── spas-sdk-metadata-processor/   # Compile-time annotation processor
├── spas-sdk-events/               # Event publishing
├── spas-sdk-spring/               # Spring Boot integration (optional)
└── examples/
    └── sample-service/            # Reference implementation
```

## 🔧 Building

```bash
# Build all modules
mvn clean install

# Run tests
mvn test

# Check coverage
mvn verify
```

## 📚 Related Documentation

- [SPAS SDK Principles](../../../principles/component/12-sdk.md)
- [Design-Time Metadata Schema](../schemas/design-time-metadata-v1.schema.json)
- [.NET SDK Reference](../dotnet/README.md)
