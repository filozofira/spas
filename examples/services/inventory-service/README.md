# Inventory Service

SPAS-compliant stock tracking and reservation service.

## Capabilities

- **Inventory Tracking**: Monitor and reserve stock levels

## Endpoints

### Commands
- `POST /inventory/items` - Initialize inventory tracking for a new product
- `POST /inventory/reserve` - Reserve stock for an order/rental
- `POST /inventory/release` - Release reserved stock back to available

### Queries
- `GET /inventory` - List all inventory items
- `GET /inventory/{productId}` - Get stock for specific product

### Events (Inbound)
- `POST /incoming` - Receive events from sidecar
  - OrderCreated - Triggers stock reservation
  - ProductAdded - Initializes inventory for new products (choreography-dependent)

### Health
- `GET /health` - Health check

## Events Published

- `InventoryItemAdded` (`com.inventory-service.inventory-item-added`) - Published when inventory tracking is initialized
- `StockReserved` (`com.inventory-service.stock-reserved`) - Published when stock is successfully reserved
- `StockDepleted` (`com.inventory-service.stock-depleted`) - Published when insufficient stock available
- `StockReleased` (`com.inventory-service.stock-released`) - Published when reserved stock is released

## Events Subscribed

- `OrderCreated` (`com.order-service.order.created`) - Triggers stock reservation
- `ProductAdded` (`com.product-service.product-added`) - Initializes inventory (when choreographed with product-service)

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
