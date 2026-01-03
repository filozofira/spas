# Fulfillment Service (Java)

A SPAS-compliant fulfillment service demonstrating the Java SDK in an e-commerce choreography.

## Overview

This service handles order fulfillment operations (pick, pack, ship) after inventory is reserved, completing the order-to-shipment flow. It demonstrates:

- **Java SPAS SDK integration** with Spring Boot
- **Compile-time metadata generation** via annotation processor
- **Capability declaration** via `@SpasService(capabilities = {"shipment-creation", "shipment-tracking"})`
- **Event consumption** from sidecar (`order-confirmed`)
- **Event publishing** to sidecar (`shipment-created`, `shipment-status-changed`)
- **W3C Trace Context propagation** for distributed tracing
- **Two choreography flows**: synchronous (Flow 1) and async (Flow 2)

### Service Capabilities

- **shipment-creation**: Create shipments for confirmed orders
- **shipment-tracking**: Track and update shipment status throughout delivery lifecycle

## Architecture

### Flow 1: Order Fulfillment (Synchronous)

```
order-service → order-confirmed → fulfillment-service → shipment-created → order-service
```

Same trace context is propagated throughout.

### Flow 2: Shipment Status Update (Separate Trace)

```
POST /api/fulfillments/{id}/status → shipment-status-changed → order-service
```

A new trace is initiated for each status update.

## Quick Start

### Prerequisites

- Java 21+
- Maven 3.8+
- Docker (for containerized deployment)

### Build

```bash
# Build and run tests
mvn clean verify

# Build without tests
mvn clean package -DskipTests
```

### Run Locally

```bash
# Run with Maven
mvn spring-boot:run

# Or run the JAR directly
java -jar target/fulfillment-service-1.0.0-SNAPSHOT.jar
```

### Run with Docker

```bash
# Build Docker image
docker build -t fulfillment-service .

# Run container
docker run -p 8080:8080 fulfillment-service
```

## API Endpoints

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fulfillments` | List all shipments |
| GET | `/api/fulfillments/{id}` | Get shipment by ID |
| GET | `/api/fulfillments/by-reference/{referenceId}` | Get shipment by external reference ID |
| POST | `/api/fulfillments/{id}/status` | Update shipment status (Flow 2) |

### Event Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/incoming` | Receive events from sidecar |

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/actuator/health` | Health check |
| GET | `/actuator/info` | Application info |
| GET | `/actuator/metrics` | Application metrics |

## Events

### Consumed Events

| Event | Source | Handler |
|-------|--------|---------|
| `order-confirmed` | order-service | Creates shipment, publishes `shipment-created` |

### Published Events

| Event | Trigger | Description |
|-------|---------|-------------|
| `shipment-created` | Order confirmed | New shipment created (Flow 1) |
| `shipment-status-changed` | Status update | Shipment status changed (Flow 2) |

## Configuration

### application.yml

```yaml
spas:
  service:
    id: fulfillment-service
    bounded-context: fulfillment
  sidecar:
    timeout: 5000
  tracing:
    enabled: true
    propagate-context: true
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVICE_NAME` | Service identifier | `unknown-service` |
| `SIDECAR_URL` | Sidecar URL (optional override) | Derived by convention |
| `SIDECAR_HOST` | Sidecar host (optional override) | Derived by convention |
| `SIDECAR_PORT` | Sidecar port (optional override) | `7000` |
| `SERVER_PORT` | Service port | `8080` |

## SPAS Metadata

The service generates `spas.json` at compile-time via the SPAS annotation processor:

```bash
# Generated metadata location
target/classes/spas.json
```

The recommended publication artifact is the metadata archive ZIP (written without starting the server):

```bash
# Default output: ./metadata/service.metadata.zip
java -Dspas.generate-metadata=true -jar target/fulfillment-service-1.0.0-SNAPSHOT.jar

# Optional: override output directory (directory will be created if missing)
java -Dspas.generate-metadata=true -Dspas.metadata.output=./out -jar target/fulfillment-service-1.0.0-SNAPSHOT.jar
```

### Annotations Used

- `@SpasService` - Service identity and bounded context
- `@SpasEvent` - Event type definitions
- `@SpasCommand` - Command endpoint contracts
- `@SpasQuery` - Query endpoint contracts

## Testing

### Run Unit Tests

```bash
mvn test
```

### Run with Coverage

```bash
mvn verify
```

### Manual Testing

```bash
# List shipments
curl http://localhost:8080/api/fulfillments

# Get specific shipment
curl http://localhost:8080/api/fulfillments/ship-abc123

# Update shipment status (triggers Flow 2)
curl -X POST http://localhost:8080/api/fulfillments/ship-abc123/status \
  -H "Content-Type: application/json" \
  -d '{"status": "SHIPPED"}'
```

## Dependencies

- **SPAS SDK**: spas-sdk-core, spas-sdk-metadata, spas-sdk-events, spas-sdk-spring
- **Spring Boot**: 3.4.1
- **Java**: 17+

## Related Documentation

- [Java SPAS SDK](../../../components/sdk/java/README.md)
- [Order Fulfillment Domain](../../domains/order-fulfillment/README.md)
