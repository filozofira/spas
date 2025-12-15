# Fulfillment Service (Stub)

E-Commerce domain-specific logistics mock service.

## Purpose

Simulates pick, pack, and ship operations for the E-Commerce domain. This is a **stub service** (not SPAS-compliant) demonstrating domain-specific downstream consumers.

## Endpoints

### Events (Inbound)
- `POST /incoming` - Receive events from sidecar
  - StockReserved - Triggers fulfillment processing

### Queries
- `GET /fulfillments` - List all fulfillments
- `GET /fulfillments/{id}` - Get specific fulfillment

### Health
- `GET /health` - Health check

## Events Published

- `FulfillmentCompleted` (`com.ecommerce.fulfillment.completed`)

## Events Subscribed

- `StockReserved` (`com.inventory.stock.reserved`)

## Configuration

Environment variables:
- `SERVICE_NAME=fulfillment-service`
- `SIDECAR_HOST=fulfillment-service-sidecar`
- `SIDECAR_PORT=7010`
- `PORT=8080`

## Event Flow

1. Receives `StockReserved` event via `/incoming`
2. Creates fulfillment record
3. Publishes `FulfillmentCompleted` event via sidecar

## Build & Run

### Local Development
```bash
npm install
npm start
```

### Docker
```bash
docker build -t fulfillment-service:1.0.0 .
docker run -p 8080:8080 fulfillment-service:1.0.0
```

## NOT SPAS-Compliant

This is a domain-specific stub service. It does NOT use the SPAS SDK and does NOT publish metadata to the Repository.
