# SPAS SDK for Java

[![Java](https://img.shields.io/badge/Java-17+-orange)](https://openjdk.org/)
[![Maven](https://img.shields.io/badge/Maven-3.8+-blue)](https://maven.apache.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../../LICENSE)

The Java SDK for building **SPAS (Self-contained, Portable, Adaptable Services)** — services that publish rich metadata, communicate via events, and maintain distributed trace context.

> The core SDK modules (`spas-sdk-core`, `spas-sdk-metadata`, `spas-sdk-events`) are **framework-agnostic** and work with any Java HTTP framework (JAX-RS, plain servlets, Micronaut, Quarkus, etc.). The `spas-sdk-spring` module is an **optional** integration for Spring Boot applications.

## For Users

### Quick Start

1. Run the reference sample-service:

```bash
cd components/sdk/java/examples/sample-service
mvn spring-boot:run
```

2. Use a runnable end-to-end example: [Examples Services README](../../../examples/services/README.md)

### Modules

| Module                        | Description                          | Spring Required?  |
| ----------------------------- | ------------------------------------ | ----------------- |
| `spas-sdk-core`               | Context, configuration, utilities    | ❌ No             |
| `spas-sdk-metadata`           | Annotations, builders, model classes | ❌ No             |
| `spas-sdk-metadata-processor` | Compile-time `spas.json` generation  | ❌ No             |
| `spas-sdk-events`             | Event publishing to sidecar          | ❌ No             |
| `spas-sdk-spring`             | Spring Boot auto-configuration       | ✅ Yes (optional) |

### Features

**Metadata Generation:**

- Annotation-based: `@SpasCommand`, `@SpasQuery`, `@SpasEvent`
- Compile-time generation: `spas.json` created during Maven build
- Schema validation: Validates against design-time-metadata-v1 schema
- Kebab-case normalization: `OrderCreated` → `order-created`

**Event Publishing:**

- Simple API: `EventPublisher.publishAsync(event)`
- Automatic headers: traceparent, x-service-name, x-event-name, x-correlation-id
- Sidecar integration: Posts to sidecar `/publish` endpoint
- No CloudEvents wrapping: Sidecar handles envelope construction

**Context Propagation:**

- W3C Trace Context: Full traceparent/tracestate support
- Identity propagation: x-user-id, x-tenant-id headers
- Thread-safe: InheritableThreadLocal for async operations

### Configuration

The SDK uses environment variables matching docker-compose patterns:

| Variable       | Required | Description                                          |
| -------------- | -------- | ---------------------------------------------------- |
| `SERVICE_NAME` | Yes      | Service identifier (fails fast if missing)           |
| `SIDECAR_URL`  | No       | Full sidecar URL (e.g., `http://localhost:7000`)     |
| `SIDECAR_HOST` | No       | Sidecar hostname (default: `{service-name}-sidecar`) |
| `SIDECAR_PORT` | No       | Sidecar port (default: `7000`)                       |

#### Sidecar URL Resolution Priority

The SDK resolves the sidecar URL in this order (first match wins):

1. **`SIDECAR_URL`** — Full URL, highest priority (`http://custom-sidecar:8080`)
2. **`SIDECAR_HOST` + `SIDECAR_PORT`** — Explicit host/port (`http://my-sidecar:7001`)
3. **Derived from `SERVICE_NAME`** — Convention-based (`order-service` → `http://order-service-sidecar:7000`). Recommended for Docker Compose.
4. **Localhost fallback** — No configuration needed (`http://localhost:7000`)

### Writing Effective Descriptions

Descriptions are optional but strongly recommended for AI-assisted choreography.

**Rules:** Plain text only; describe intent, not implementation.

**Good examples:**

- Service: "Creates and tracks shipments for confirmed orders; publishes shipment lifecycle events"
- Command: "Creates a shipment for a confirmed order using destination address; emits ShipmentCreated"
- Event: "Emitted when shipment status changes; indicates progress through fulfillment lifecycle"

**Bad examples:** "CreateShipment" (restates name), "Does the thing" (too generic)

### Module Reference

| Module                          | Purpose              | Key Types                                            |
| ------------------------------- | -------------------- | ---------------------------------------------------- |
| **spas-sdk-core**               | Foundation types     | `SpasContext`, `SpasConfiguration`, `SpasIdentity`   |
| **spas-sdk-metadata**           | Metadata composition | `@SpasCommand`, `@SpasQuery`, `@SpasEvent`, builders |
| **spas-sdk-metadata-processor** | Compile-time gen     | Annotation processor (`spas.json` output)            |
| **spas-sdk-events**             | Event publishing     | `EventPublisher`, `SpasEventBuilder`                 |
| **spas-sdk-spring**             | Spring integration   | Auto-configuration, property binding                 |

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
