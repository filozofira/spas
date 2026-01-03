# Data Model: Product CRUD Operations

**Feature**: 001-product-crud-operations  
**Date**: 2026-01-03  
**Purpose**: Define entities, events, and data structures for product CRUD operations

## Core Entities

### Product

The central entity representing a product in the catalog.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| ProductId | string | Required, unique, 1-50 chars, pattern: `^[a-z0-9-]+$` | Unique product identifier (lowercase alphanumeric with hyphens) |
| Name | string | Required, 1-200 chars | Product display name |
| Category | string | Required | Product classification (e.g., Electronics, Furniture) |
| Price | decimal | Required, >= 0 | Product price in currency units |
| Description | string | Required, 1-2000 chars | Detailed product information |

**Validation Rules**:
- ProductId must be unique across all products
- ProductId must match pattern `^[a-z0-9-]+$` (lowercase, alphanumeric, hyphens only)
- Name cannot be empty or whitespace-only
- Description cannot be empty or whitespace-only
- Price must be non-negative
- All fields are required (no null values)

**Relationships**:
- None (simple entity, no relationships in example service)

**State Transitions**:
- Created → Active (via Add operation)
- Active → Modified (via Update operation, state remains Active)
- Active → Deleted (via Remove operation, removed from catalog)

## Domain Events

### ProductAdded

Emitted when a new product is successfully added to the catalog.

**Attributes**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ProductId | string | Yes | ID of the added product |
| Name | string | Yes | Product name |
| Category | string | Yes | Product category |
| Price | decimal | Yes | Product price |
| Description | string | Yes | Product description |

**Event Metadata**:
- **Event Name**: `product-added`
- **Version**: `1.0`
- **CloudEvents Type**: `com.product-service.product-added` (constructed by sidecar)
- **Trigger**: POST /products succeeds

**Schema** (JSON):
```json
{
  "type": "object",
  "required": ["productId", "name", "category", "price", "description"],
  "properties": {
    "productId": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$",
      "minLength": 1,
      "maxLength": 50
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "category": {
      "type": "string",
      "minLength": 1
    },
    "price": {
      "type": "number",
      "minimum": 0
    },
    "description": {
      "type": "string",
      "minLength": 1,
      "maxLength": 2000
    }
  }
}
```

**Example Payload**:
```json
{
  "productId": "laptop-pro-15",
  "name": "Laptop Pro 15",
  "category": "Electronics",
  "price": 1299.99,
  "description": "High-performance laptop with 15-inch display"
}
```

**Consumer Use Cases**:
- Inventory systems track new products
- Search indexing services add to search catalog
- Analytics systems track product additions
- Notification services alert subscribed users

---

### ProductUpdated

Emitted when an existing product is successfully updated. Includes change tracking.

**Attributes**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ProductId | string | Yes | ID of the updated product |
| Changes | object | Yes | Map of changed fields with old/new values |

**Change Object Structure**:

Each changed field is represented as:
```json
{
  "fieldName": {
    "oldValue": <previous value>,
    "newValue": <new value>
  }
}
```

**Event Metadata**:
- **Event Name**: `product-updated`
- **Version**: `1.0`
- **CloudEvents Type**: `com.product-service.product-updated`
- **Trigger**: PATCH /products/{id} succeeds

**Schema** (JSON):
```json
{
  "type": "object",
  "required": ["productId", "changes"],
  "properties": {
    "productId": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$"
    },
    "changes": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "required": ["oldValue", "newValue"],
        "properties": {
          "oldValue": {},
          "newValue": {}
        }
      }
    }
  }
}
```

**Example Payload** (price and description changed):
```json
{
  "productId": "laptop-pro-15",
  "changes": {
    "price": {
      "oldValue": 1299.99,
      "newValue": 1199.99
    },
    "description": {
      "oldValue": "High-performance laptop with 15-inch display",
      "newValue": "High-performance laptop with 15-inch 4K display and 32GB RAM"
    }
  }
}
```

**Example Payload** (single field changed):
```json
{
  "productId": "laptop-pro-15",
  "changes": {
    "category": {
      "oldValue": "Electronics",
      "newValue": "Computers"
    }
  }
}
```

**Consumer Use Cases**:
- Inventory systems update product details
- Search indexing services update indexed data
- Price tracking systems monitor price changes
- Notification services alert users of changes
- Audit systems track field-level changes

---

### ProductRemoved

Emitted when a product is successfully removed from the catalog.

**Attributes**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ProductId | string | Yes | ID of the removed product |
| Name | string | Yes | Product name at time of removal |
| Category | string | Yes | Product category at time of removal |
| Price | decimal | Yes | Product price at time of removal |
| Description | string | Yes | Product description at time of removal |

**Event Metadata**:
- **Event Name**: `product-removed`
- **Version**: `1.0`
- **CloudEvents Type**: `com.product-service.product-removed`
- **Trigger**: DELETE /products/{id} succeeds

**Schema** (JSON):
```json
{
  "type": "object",
  "required": ["productId", "name", "category", "price", "description"],
  "properties": {
    "productId": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$"
    },
    "name": {
      "type": "string"
    },
    "category": {
      "type": "string"
    },
    "price": {
      "type": "number"
    },
    "description": {
      "type": "string"
    }
  }
}
```

**Example Payload**:
```json
{
  "productId": "laptop-pro-15",
  "name": "Laptop Pro 15",
  "category": "Electronics",
  "price": 1199.99,
  "description": "High-performance laptop with 15-inch 4K display and 32GB RAM"
}
```

**Consumer Use Cases**:
- Inventory systems remove product from active catalog
- Search indexing services remove from search results
- Analytics systems track product removals
- Audit systems maintain removal history
- Recommendation engines update product associations

## Request/Response Models

### AddProductRequest

Request model for adding a new product.

**Attributes**:

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| ProductId | string | Yes | 1-50 chars, `^[a-z0-9-]+$` | Product identifier |
| Name | string | Yes | 1-200 chars | Product name |
| Category | string | Yes | Non-empty | Product category |
| Price | decimal | Yes | >= 0 | Product price |
| Description | string | Yes | 1-2000 chars | Product description |

**Example**:
```json
{
  "productId": "wireless-mouse",
  "name": "Wireless Mouse",
  "category": "Electronics",
  "price": 29.99,
  "description": "Ergonomic wireless mouse with precision tracking"
}
```

---

### UpdateProductRequest

Request model for partially updating a product (PATCH semantics).

**Attributes**:

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| Name | string | No | 1-200 chars | Updated product name |
| Category | string | No | Non-empty | Updated product category |
| Price | decimal | No | >= 0 | Updated product price |
| Description | string | No | 1-2000 chars | Updated product description |

**Notes**:
- All fields are optional (partial update)
- Only provided fields will be updated
- ProductId cannot be changed (not included in update request)
- At least one field must be provided

**Example** (update price only):
```json
{
  "price": 24.99
}
```

**Example** (update multiple fields):
```json
{
  "name": "Premium Wireless Mouse",
  "price": 39.99,
  "description": "Premium ergonomic wireless mouse with precision tracking and customizable buttons"
}
```

## Storage Model

**Implementation**: In-memory using `ConcurrentDictionary<string, Product>`

**Key**: ProductId (string)  
**Value**: Product record (immutable)

**Operations**:
- **Add**: `TryAdd(productId, product)` - atomic insert with existence check
- **Get**: `TryGetValue(productId, out product)` - atomic read
- **Update**: `AddOrUpdate(productId, addValue, updateFunc)` - atomic update
- **Remove**: `TryRemove(productId, out product)` - atomic delete
- **List**: `Values` property - snapshot of all products

**Thread Safety**: ConcurrentDictionary provides built-in thread safety for all operations.

**Persistence**: None (in-memory only). Data resets on service restart, consistent with example service purpose.

## Validation Rules Summary

### ProductId Validation
- **Pattern**: Must match `^[a-z0-9-]+$`
- **Length**: 1-50 characters
- **Uniqueness**: Must be unique across all products (enforced on add)
- **Immutability**: Cannot be changed after creation

### Name Validation
- **Length**: 1-200 characters
- **Required**: Cannot be null, empty, or whitespace-only
- **Content**: Any Unicode characters allowed

### Category Validation
- **Required**: Cannot be null, empty, or whitespace-only
- **Content**: Any string (no enumeration enforcement in example)

### Price Validation
- **Range**: Must be >= 0 (non-negative)
- **Type**: Decimal (supports fractional currency values)
- **Required**: Cannot be null

### Description Validation
- **Length**: 1-2000 characters
- **Required**: Cannot be null, empty, or whitespace-only
- **Content**: Any Unicode characters allowed

## Event Ordering Guarantees

**Ordering**: Not guaranteed. Events are published best-effort without ordering constraints.

**Implications**:
- Consumers should not rely on event order for correctness
- ProductUpdated events include full change context (old/new values)
- ProductRemoved events include full product state at removal time
- Event timestamps and correlation IDs enable reconstruction if needed

**Idempotency**: Consumers should handle duplicate events (same productId, same operation) idempotently.

## Data Migration

**N/A**: In-memory storage, no migration concerns. Service starts with seeded sample data.
