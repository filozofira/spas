# Order Service

SPAS-compliant order lifecycle management service for E-Commerce and B2B domains.

## Capabilities

- **Order Management**: Create and track orders

## Endpoints

### Commands
- `POST /orders` - Create new order
  - Request: `{ customerId, items[], total }`
  - Response: `{ orderId, status }`

### Queries
- `GET /orders` - List all orders
- `GET /orders/{id}` - Get specific order

### Events (Inbound)
- `POST /incoming` - Receive events from sidecar
  - OrderRequested (B2B subscription scenario)

### Health
- `GET /health` - Health check

## Events Published

- `OrderCreated` (`com.ecommerce.order.created`) - Published after order creation

## Events Subscribed

- `OrderRequested` (`com.b2b.order.requested`) - B2B domain only

## Configuration

Environment variables:
- `SERVICE_NAME=order-service`
- `SIDECAR_HOST=order-service-sidecar`
- `SIDECAR_PORT=7001`
- `ZIPKIN_URL=http://zipkin:9411`

## Build & Run

### Local Development
```bash
dotnet run
```

### Docker
```bash
docker build -f Dockerfile -t order-service:1.0.0 ../../..
docker run -p 8080:8080 order-service:1.0.0
```

## SPAS Compliance

- ✅ Single bounded context: ecommerce
- ✅ Event-first integration
- ✅ SDK integration (metadata, events, observability)
- ✅ W3C Trace Context propagation
- ✅ Health endpoints
- ✅ Sidecar-mediated communication
