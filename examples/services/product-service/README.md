# Product Service

SPAS-compliant product catalog management service with full CRUD operations and event emission.

## Capabilities

- **Product Catalog Management**: Create, read, update, and delete products with validation and event emission

## Endpoints

### Commands
- `POST /products` - Add a new product to the catalog
  - Returns: `201 Created` with product details
  - Events: Emits `product-added` event
  - Errors: `400 Bad Request` (validation), `409 Conflict` (duplicate ID)

- `PATCH /products/{id}` - Update existing product (partial update)
  - Returns: `200 OK` with updated product
  - Events: Emits `product-updated` event with full current state
  - Errors: `400 Bad Request` (validation), `404 Not Found`

- `DELETE /products/{id}` - Remove product from catalog
  - Returns: `204 No Content`
  - Events: Emits `product-removed` event
  - Errors: `404 Not Found`

### Queries
- `GET /products` - List all products (optional `?category=Electronics` filter)
- `GET /products/{id}` - Get specific product details

### Health
- `GET /health` - Health check

## Events

### Published Events

- **product-added** (`v1.0`): Emitted when a new product is successfully added
  - Fields: `productId`, `name`, `category`, `price`, `description`

- **product-updated** (`v1.0`): Emitted when a product is successfully updated
  - Fields: `productId`, `name`, `category`, `price`, `description` (full current state)

- **product-removed** (`v1.0`): Emitted when a product is successfully removed
  - Fields: `productId`, `name`, `category`, `price`, `description` (state at removal)

All events are emitted via SPAS EventPublisher to the sidecar using best-effort delivery (failures are logged but don't block operations).

## Validation Rules

### Product ID
- Required, unique
- Length: 1-50 characters
- Pattern: `^[a-z0-9-]+$` (lowercase alphanumeric with hyphens only)

### Name
- Required
- Max length: 200 characters

### Category
- Required

### Price
- Required
- Must be >= 0

### Description
- Required
- Max length: 2000 characters

## Configuration

Environment variables:
- `SERVICE_NAME=product-service`
- `SIDECAR_HOST=product-service-sidecar`
- `SIDECAR_PORT=7003`
- `ZIPKIN_URL=http://zipkin:9411`

## Sample Data

Pre-seeded with 5 products across Electronics and Furniture categories:
- `prod-001`: Laptop Pro 15
- `prod-002`: Wireless Mouse
- `prod-003`: USB-C Hub
- `prod-004`: Office Chair
- `prod-005`: Standing Desk

## Usage Examples

### Add a Product
```bash
curl -X POST http://localhost:8080/products \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "laptop-gaming-17",
    "name": "Gaming Laptop 17",
    "category": "Electronics",
    "price": 1899.99,
    "description": "High-performance gaming laptop with RTX graphics"
  }'
```

### Update a Productproduct
- ✅ Event-first integration: All state changes emit domain events (product-added, product-updated, product-removed)
- ✅ SDK integration: Metadata, Events (EventPublisher), Observability, Inbound
- ✅ W3C Trace Context propagation: Automatic via SDK
- ✅ Health endpoints: `/_spas/health/*`
- ✅ Sidecar-mediated communication: Events published via HTTP to sidecar
- ✅ Best-effort event delivery: Operations succeed even if event emission fails (logged)
- ✅ Validation: ProductValidator centralizes business rules
- ✅ In-memory storage: ConcurrentDictionary for thread-safe operations (example service pattern)
    "description": "Updated description with sale price"
  }'
```

### Remove a Product
```bash
curl -X DELETE http://localhost:8080/products/prod-005
```

### List Products
```bash
curl http://localhost:8080/products
curl http://localhost:8080/products?category=Electronics
```

### Get Product Details
```bash
curl http://localhost:8080/products/prod-001
```

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

### Generate Metadata
```bash
dotnet run --generate-metadata
```

## SPAS Compliance

- ✅ Single bounded context: catalog
- ✅ Event-first integration (query-only: no events)
- ✅ SDK integration (metadata, events, observability)
- ✅ W3C Trace Context propagation
- ✅ Health endpoints
- ✅ Sidecar-mediated communication
