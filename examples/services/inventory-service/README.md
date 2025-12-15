# Inventory Service

SPAS-compliant stock tracking and reservation service.

## Capabilities

- **Inventory Tracking**: Monitor and reserve stock levels

## Endpoints

### Queries
- `GET /inventory` - List all inventory items
- `GET /inventory/{productId}` - Get stock for specific product

### Events (Inbound)
- `POST /incoming` - Receive events from sidecar
  - OrderCreated - Triggers stock reservation

### Health
- `GET /health` - Health check

## Events Published

- `StockReserved` (`com.inventory.stock.reserved`) - Published when stock is successfully reserved
- `StockDepleted` (`com.inventory.stock.depleted`) - Published when insufficient stock available

## Events Subscribed

- `OrderCreated` (`com.ecommerce.order.created`) - Triggers stock reservation

## Configuration

Environment variables:
- `SERVICE_NAME=inventory-service`
- `SIDECAR_HOST=inventory-service-sidecar`
- `SIDECAR_PORT=7002`
- `ZIPKIN_URL=http://zipkin:9411`

## Sample Data

Pre-seeded with:
- prod-001: 100 units
- prod-002: 50 units
- prod-003: 75 units

## Build & Run

### Local Development
```bash
dotnet run
```

### Docker
```bash
docker build -f Dockerfile -t inventory-service:1.0.0 ../../..
docker run -p 8080:8080 inventory-service:1.0.0
```

## SPAS Compliance

- ✅ Single bounded context: inventory
- ✅ Event-first integration
- ✅ SDK integration (metadata, events, observability)
- ✅ W3C Trace Context propagation
- ✅ Health endpoints
- ✅ Sidecar-mediated communication
