# Product Service

SPAS-compliant product catalog browsing service.

## Capabilities

- **Product Catalog**: Browse products and categories

## Endpoints

### Queries
- `GET /products` - List all products (optional `?category=Electronics` filter)
- `GET /products/{id}` - Get specific product details

### Health
- `GET /health` - Health check

## Events

No events published or subscribed (query-only service).

## Configuration

Environment variables:
- `SERVICE_NAME=product-service`
- `SIDECAR_HOST=product-service-sidecar`
- `SIDECAR_PORT=7003`
- `ZIPKIN_URL=http://zipkin:9411`

## Sample Data

Pre-seeded with 5 products across Electronics and Furniture categories.

## Build & Run

### Local Development
```bash
dotnet run
```

### Docker
```bash
docker build -f Dockerfile -t product-service:1.0.0 ../../..
docker run -p 8080:8080 product-service:1.0.0
```

## SPAS Compliance

- ✅ Single bounded context: catalog
- ✅ Event-first integration (query-only: no events)
- ✅ SDK integration (metadata, events, observability)
- ✅ W3C Trace Context propagation
- ✅ Health endpoints
- ✅ Sidecar-mediated communication
