# SPAS SDK for Java

[![Java](https://img.shields.io/badge/Java-17+-orange)](https://openjdk.org/)
[![Maven](https://img.shields.io/badge/Maven-3.8+-blue)](https://maven.apache.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../../LICENSE)

The Java SDK for building **SPAS (Self-contained, Portable, Adaptable Services)** — services that publish rich metadata, communicate via events, and maintain distributed trace context.

> The core SDK modules (`spas-sdk-core`, `spas-sdk-metadata`, `spas-sdk-events`) are **framework-agnostic** and work with any Java HTTP framework (JAX-RS, plain servlets, Micronaut, Quarkus, etc.). The `spas-sdk-spring` module is an **optional** integration for Spring Boot applications.

## For Users

### Local Development Setup

> **Note:** The SPAS Java SDK is currently **not published to Maven Central**. All development uses your **local Maven repository** (`~/.m2/repository/`) only.

When developing services that reference SPAS SDK packages, you need to build and install the SDK to your local Maven repository:

**One-time setup:**
```bash
cd components/sdk/java
mvn clean install
```

This will build all SDK modules and install them to `~/.m2/repository/`, making them available for other projects to reference.

**After SDK changes:**
```bash
mvn clean install
```

### Quick Start

1. Run the reference sample-service:

```bash
cd components/sdk/java/examples/sample-service
mvn spring-boot:run
```

2. Use a runnable end-to-end example: [Examples Services README](../../../examples/services/README.md)

### Generate Design-time Metadata (Offline)

Generate the complete design-time metadata archive without starting the HTTP server.

**Spring Boot**

```bash
cd components/sdk/java/examples/sample-service
mvn -q -DskipTests spring-boot:run -Dspring-boot.run.arguments="--generate-metadata --output ./metadata"
```

This writes `./metadata/service.metadata.zip` (containing `spas.json` + referenced schemas).

### Modules

| Module                          | Purpose                    | Key Types                                            |
| ------------------------------- | -------------------------- | ---------------------------------------------------- |
| `spas-sdk-core`                 | Context, configuration     | `SpasContext`, `SpasConfiguration`, `SpasIdentity`   |
| `spas-sdk-metadata`             | Annotations, builders      | `@SpasCommand`, `@SpasQuery`, `@SpasEvent`, builders |
| `spas-sdk-metadata-processor`   | Compile-time generation    | Annotation processor (`spas.json` output)            |
| `spas-sdk-events`               | Event publishing (sidecar) | `EventPublisher`, `SpasEventBuilder`                 |
| `spas-sdk-spring`               | Spring integration         | Auto-configuration, property binding                 |

### Features

**Metadata Generation:**

- Annotation-based: `@SpasCommand`, `@SpasQuery`, `@SpasEvent`
- Offline archive generation: `service.metadata.zip` created via `--generate-metadata`
- Compile-time generation: `spas.json` created during Maven build (optional)
- Schema validation: Validates against design-time-metadata-v1 schema
- Kebab-case normalization: `OrderCreated` → `order-created`

**Event Publishing:**

- Simple API: `EventPublisher.publishAsync(event)`
- Automatic headers: traceparent, x-service-name, x-event-name, x-correlation-id
- Sidecar integration: Posts to sidecar `/publish` endpoint
- Sidecar handles CloudEvents wrapping

**Context Propagation:**

- W3C Trace Context: Full traceparent/tracestate support
- Identity propagation: x-user-id, x-tenant-id headers
- Thread-safe: InheritableThreadLocal for async operations

### Capability Declaration

Declare service capabilities using the `capabilities` attribute in the `@SpasService` annotation:

```java
@SpringBootApplication
@SpasService(
    id = "basket-service",
    name = "Basket Service",
    boundedContext = "shopping",
    version = "1.0.0",
    description = "Manages shopping baskets for customers",
    capabilities = {"basket-management", "checkout-initiation"}
)
public class BasketServiceApplication {
    public static void main(String[] args) {
        SpasServiceRunner.run(BasketServiceApplication.class, args);
    }
}
```

**Key Points:**
- Capabilities are auto-discovered from the `@SpasService` annotation's `capabilities` attribute
- No manual registration needed (~~`options.addCapability()`~~ is deprecated)
- Use kebab-case for consistency (e.g., `basket-management`)
- Capabilities define what the service can do, not which events it handles

### Configuration

The SDK uses environment variables matching docker-compose patterns:

| Variable       | Required | Description                                          |
| -------------- | -------- | ---------------------------------------------------- |
| `SERVICE_NAME` | Yes      | Service identifier (fails fast if missing)           |
| `SIDECAR_URL`  | No       | Full sidecar URL (e.g., `http://localhost:7000`)     |
| `SIDECAR_HOST` | No       | Sidecar hostname (default: `{service-name}-sidecar`) |
| `SIDECAR_PORT` | No       | Sidecar port (default: `7000`)                       |

**Sidecar URL Resolution:** `SIDECAR_URL` > `SIDECAR_HOST:PORT` > derived from `SERVICE_NAME` > localhost. See [Sidecar Contract](../../../principles/component/10-sidecar-contract.md) for details.

### Writing Effective Descriptions

Descriptions improve AI-assisted choreography. Use plain text describing intent, not implementation.

- ✅ Good: "Creates a shipment for a confirmed order using destination address; emits ShipmentCreated"
- ❌ Bad: "CreateShipment" (restates name), "Does the thing" (too generic)

More examples: [SDK Principles](../../../principles/component/12-sdk.md)

### Health Checks

The SDK **automatically** exposes standard health endpoints when using `spas-sdk-spring` (via Spring Boot auto-configuration). No additional setup required.

**Endpoints:**

- `GET /_spas/health/live`: Liveness probe (Always UP)
- `GET /_spas/health/ready`: Readiness probe (Delegates to Spring Boot Actuator)

**Response format:**
```json
{ "status": "UP" }
```

**Adding custom checks:**

Implement `HealthIndicator` beans as per standard Spring Boot Actuator documentation:

```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        return Health.up().withDetail("database", "connected").build();
    }
}
```

### Additional Resources

- [sample-service](./examples/sample-service/README.md) — Complete working example
- [Examples Services](../../../examples/services/README.md) — Runnable domain examples
- [SPAS SDK Principles](../../../principles/component/12-sdk.md)
- [Communication Model](../../../principles/protocol/07-communication-model.md)
- [Event Protocol](../../../principles/protocol/09-event-protocol.md)
- [.NET SDK Reference](../dotnet/README.md)

### PoC vs Production

This SDK is a PoC. Review security considerations before treating it as production-ready.

## For Contributors

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

See [LICENSE](../../../LICENSE) in the repository root.
