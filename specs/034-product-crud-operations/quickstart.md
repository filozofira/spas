# Quickstart: Product CRUD Operations

**Feature**: 033-product-crud-operations  
**Date**: 2026-01-03  
**Purpose**: Quick reference guide for using the extended product-service with CRUD operations

## Overview

The product-service now supports full CRUD (Create, Read, Update, Delete) operations with automatic event emission. All state-changing operations emit domain events through the SPAS sidecar.

## Prerequisites

- Docker or Docker Compose (for running the service)
- HTTP client (curl, Postman, or similar)
- Service running on `http://localhost:8080`

## Operations

### 1. List All Products

Get all products in the catalog.

**Request**:
```bash
curl -X GET http://localhost:8080/products
```

**Response** (200 OK):
```json
[
  {
    "productId": "prod-001",
    "name": "Laptop Pro 15",
    "category": "Electronics",
    "price": 1299.99,
    "description": "High-performance laptop with 15-inch display"
  },
  {
    "productId": "prod-002",
    "name": "Wireless Mouse",
    "category": "Electronics",
    "price": 29.99,
    "description": "Ergonomic wireless mouse with precision tracking"
  }
]
```

**Filter by Category**:
```bash
curl -X GET "http://localhost:8080/products?category=Electronics"
```

---

### 2. Get Product by ID

Retrieve specific product details.

**Request**:
```bash
curl -X GET http://localhost:8080/products/prod-001
```

**Response** (200 OK):
```json
{
  "productId": "prod-001",
  "name": "Laptop Pro 15",
  "category": "Electronics",
  "price": 1299.99,
  "description": "High-performance laptop with 15-inch display"
}
```

**Error - Not Found** (404):
```bash
curl -X GET http://localhost:8080/products/nonexistent
# Response: {"error": "Product not found"}
```

---

### 3. Add New Product ⭐ NEW

Create a new product in the catalog.

**Request**:
```bash
curl -X POST http://localhost:8080/products \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "usb-c-hub",
    "name": "USB-C Hub 7-in-1",
    "category": "Electronics",
    "price": 49.99,
    "description": "Multi-port USB-C hub with HDMI, ethernet, and USB 3.0 ports"
  }'
```

**Response** (201 Created):
```json
{
  "productId": "usb-c-hub",
  "name": "USB-C Hub 7-in-1",
  "category": "Electronics",
  "price": 49.99,
  "description": "Multi-port USB-C hub with HDMI, ethernet, and USB 3.0 ports"
}
```

**Event Emitted**: `ProductAdded`
```json
{
  "productId": "usb-c-hub",
  "name": "USB-C Hub 7-in-1",
  "category": "Electronics",
  "price": 49.99,
  "description": "Multi-port USB-C hub with HDMI, ethernet, and USB 3.0 ports"
}
```
(CloudEvents type: `com.product-service.product-added`)

**Validation Errors** (400 Bad Request):
```bash
# Missing required field
curl -X POST http://localhost:8080/products \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "test",
    "name": "Test Product",
    "category": "Test"
  }'
# Response: Validation error for missing "price" and "description"

# Invalid product ID format (uppercase not allowed)
curl -X POST http://localhost:8080/products \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "TEST-Product",
    "name": "Test Product",
    "category": "Test",
    "price": 10.00,
    "description": "Test description"
  }'
# Response: ProductId must contain only lowercase letters, numbers, and hyphens

# Negative price
curl -X POST http://localhost:8080/products \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "test-product",
    "name": "Test Product",
    "category": "Test",
    "price": -10.00,
    "description": "Test description"
  }'
# Response: Price must be greater than or equal to 0
```

**Duplicate ID Error** (409 Conflict):
```bash
curl -X POST http://localhost:8080/products \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod-001",
    "name": "Duplicate",
    "category": "Test",
    "price": 10.00,
    "description": "This will fail"
  }'
# Response: {"error": "Product with ID 'prod-001' already exists"}
```

---

### 4. Update Product (Partial) ⭐ NEW

Update one or more fields of an existing product.

**Update Price Only**:
```bash
curl -X PATCH http://localhost:8080/products/prod-001 \
  -H "Content-Type: application/json" \
  -d '{
    "price": 1199.99
  }'
```

**Response** (200 OK):
```json
{
  "productId": "prod-001",
  "name": "Laptop Pro 15",
  "category": "Electronics",
  "price": 1199.99,
  "description": "High-performance laptop with 15-inch display"
}
```

**Event Emitted**: `ProductUpdated`
```json
{
  "productId": "prod-001",
  "changes": {
    "price": {
      "oldValue": 1299.99,
      "newValue": 1199.99
    }
  }
}
```
(CloudEvents type: `com.product-service.product-updated`)

**Update Multiple Fields**:
```bash
curl -X PATCH http://localhost:8080/products/prod-001 \
  -H "Content-Type: application/json" \
  -d '{
    "price": 1099.99,
    "description": "High-performance laptop with 15-inch 4K display, 32GB RAM, and 1TB SSD"
  }'
```

**Response** (200 OK):
```json
{
  "productId": "prod-001",
  "name": "Laptop Pro 15",
  "category": "Electronics",
  "price": 1099.99,
  "description": "High-performance laptop with 15-inch 4K display, 32GB RAM, and 1TB SSD"
}
```

**Event Emitted**: `ProductUpdated`
```json
{
  "productId": "prod-001",
  "changes": {
    "price": {
      "oldValue": 1199.99,
      "newValue": 1099.99
    },
    "description": {
      "oldValue": "High-performance laptop with 15-inch display",
      "newValue": "High-performance laptop with 15-inch 4K display, 32GB RAM, and 1TB SSD"
    }
  }
}
```

**Error - Not Found** (404):
```bash
curl -X PATCH http://localhost:8080/products/nonexistent \
  -H "Content-Type: application/json" \
  -d '{"price": 99.99}'
# Response: {"error": "Product not found"}
```

**Validation Error** (400):
```bash
curl -X PATCH http://localhost:8080/products/prod-001 \
  -H "Content-Type: application/json" \
  -d '{"price": -50.00}'
# Response: Validation error - price must be non-negative
```

---

### 5. Remove Product ⭐ NEW

Delete a product from the catalog.

**Request**:
```bash
curl -X DELETE http://localhost:8080/products/usb-c-hub
```

**Response** (204 No Content):
(Empty response body)

**Event Emitted**: `ProductRemoved`
```json
{
  "productId": "usb-c-hub",
  "name": "USB-C Hub 7-in-1",
  "category": "Electronics",
  "price": 49.99,
  "description": "Multi-port USB-C hub with HDMI, ethernet, and USB 3.0 ports"
}
```
(CloudEvents type: `com.product-service.product-removed`)

**Verify Removal**:
```bash
curl -X GET http://localhost:8080/products/usb-c-hub
# Response (404): {"error": "Product not found"}
```

**Error - Not Found** (404):
```bash
curl -X DELETE http://localhost:8080/products/nonexistent
# Response: {"error": "Product not found"}
```

---

## Event Integration

All state-changing operations emit events through the SPAS sidecar. Events are published on a best-effort basis.

### Event Flow

1. **Client** → HTTP request to product-service
2. **Product Service** → Processes operation (add/update/remove)
3. **Product Service** → Emits event via SDK to sidecar
4. **Sidecar** → Wraps event in CloudEvents format
5. **Sidecar** → Routes event to configured topic/subscribers

### Event Headers (sent by SDK to sidecar)

- `traceparent`: W3C Trace Context for distributed tracing
- `x-service-name`: `product-service`
- `x-event-name`: `product-added`, `product-updated`, or `product-removed`
- `x-correlation-id`: Request correlation ID
- `x-user-id`: User identity (if available)
- `x-tenant-id`: Tenant identity (if available)

### Consuming Events

Events are available through the sidecar's event routing mechanism. Configure choreography.yaml to route product-service events to your subscriber services.

Example event consumer pattern:
```yaml
# choreography.yaml
services:
  - name: inventory-service
    subscribes:
      - source: product-service
        events:
          - product-added
          - product-updated
          - product-removed
```

## Validation Rules

### Product ID
- ✅ Lowercase letters, numbers, hyphens only: `^[a-z0-9-]+$`
- ✅ Length: 1-50 characters
- ✅ Must be unique
- ❌ Cannot contain uppercase, spaces, or special characters
- ❌ Cannot be changed after creation

### Name
- ✅ Length: 1-200 characters
- ✅ Any Unicode characters
- ❌ Cannot be empty or whitespace-only

### Category
- ✅ Non-empty string
- ✅ Any value (no enum restriction)

### Price
- ✅ Non-negative decimal: `>= 0`
- ❌ Cannot be negative

### Description
- ✅ Length: 1-2000 characters
- ✅ Any Unicode characters
- ❌ Cannot be empty or whitespace-only

## Running the Service

### Docker Compose

```bash
# From repository root
docker-compose up product-service product-service-sidecar
```

### Local Development

```bash
# From examples/services/product-service/
dotnet run
```

Service available at: `http://localhost:8080`

## Testing Workflow

Complete CRUD workflow example:

```bash
# 1. Add a new product
curl -X POST http://localhost:8080/products \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "gaming-keyboard",
    "name": "Mechanical Gaming Keyboard",
    "category": "Electronics",
    "price": 129.99,
    "description": "RGB mechanical keyboard with Cherry MX switches"
  }'

# 2. Verify it exists
curl -X GET http://localhost:8080/products/gaming-keyboard

# 3. Update the price
curl -X PATCH http://localhost:8080/products/gaming-keyboard \
  -H "Content-Type: application/json" \
  -d '{"price": 99.99}'

# 4. List all products (includes new product)
curl -X GET http://localhost:8080/products

# 5. Remove the product
curl -X DELETE http://localhost:8080/products/gaming-keyboard

# 6. Verify removal
curl -X GET http://localhost:8080/products/gaming-keyboard
# Should return 404
```

## Troubleshooting

### Common Errors

**409 Conflict - Duplicate ID**:
- Product ID already exists in catalog
- Choose a different unique ID

**400 Bad Request - Validation Error**:
- Check all required fields are present
- Verify product ID format (lowercase, alphanumeric, hyphens)
- Ensure price is non-negative
- Check field length constraints

**404 Not Found**:
- Product ID doesn't exist
- Check spelling and case (IDs are case-sensitive)

### Event Delivery Issues

Events are best-effort. If event publishing fails:
- Operation still succeeds
- Error logged in service logs
- Check sidecar connectivity and logs

## Next Steps

- Configure event routing in `choreography.yaml`
- Create event consumer services
- Add monitoring for event delivery
- Extend validation rules as needed
- Add authentication/authorization

## Related Documentation

- [Feature Specification](spec.md)
- [Data Model](data-model.md)
- [API Contract](contracts/product-service.openapi.yaml)
- [Implementation Plan](plan.md)
