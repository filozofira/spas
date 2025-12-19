# API Contract: Enhanced Services Endpoint

**Endpoint**: `GET /services`  
**Purpose**: List services with optional filtering  
**Changes**: Added support for unfiltered requests

## Endpoint Behavior

### Unfiltered Request (NEW)

**Request**:
```http
GET /services
Host: repository-service
Accept: application/json
```

**Response** (200 OK):
```json
{
  "total": 15,
  "limit": 50,
  "offset": 0,
  "results": [
    {
      "id": "inventory-service",
      "name": "Inventory Service",
      "version": "1.2.0",
      "description": "Manages product inventory and stock levels",
      "boundedContext": "inventory",
      "capabilities": ["stock-management", "inventory-queries"],
      "publishedAt": "2025-12-19T10:30:00.000Z",
      "runtime": {
        "image": "ghcr.io/example/inventory@sha256:abc123",
        "repository": "ghcr.io/example/inventory",
        "tag": "1.2.0",
        "digest": "sha256:abc123"
      }
    },
    {
      "id": "order-service", 
      "name": "Order Service",
      "version": "2.1.5",
      "description": "Handles order processing and lifecycle management",
      "boundedContext": "orders",
      "capabilities": ["order-processing", "order-queries"],
      "publishedAt": "2025-12-19T09:15:00.000Z",
      "runtime": {
        "image": "ghcr.io/example/orders@sha256:def456",
        "repository": "ghcr.io/example/orders", 
        "tag": "2.1.5",
        "digest": "sha256:def456"
      }
    }
  ]
}
```

### Filtered by Capability (EXISTING - NO CHANGES)

**Request**:
```http
GET /services?capability=order-processing
Host: repository-service
Accept: application/json
```

**Response** (200 OK):
```json
{
  "total": 2,
  "limit": 50, 
  "offset": 0,
  "results": [
    {
      "id": "order-service",
      "name": "Order Service", 
      "version": "2.1.5",
      "description": "Handles order processing and lifecycle management",
      "boundedContext": "orders",
      "capabilities": ["order-processing", "order-queries"],
      "publishedAt": "2025-12-19T09:15:00.000Z",
      "runtime": {
        "image": "ghcr.io/example/orders@sha256:def456",
        "repository": "ghcr.io/example/orders",
        "tag": "2.1.5", 
        "digest": "sha256:def456"
      }
    }
  ]
}
```

### Filtered by Bounded Context (EXISTING - NO CHANGES)

**Request**:
```http
GET /services?boundedContext=inventory
Host: repository-service
Accept: application/json
```

**Response** (200 OK):
```json
{
  "total": 3,
  "limit": 50,
  "offset": 0,
  "results": [
    {
      "id": "inventory-service",
      "name": "Inventory Service",
      "version": "1.2.0", 
      "description": "Manages product inventory and stock levels",
      "boundedContext": "inventory",
      "capabilities": ["stock-management", "inventory-queries"],
      "publishedAt": "2025-12-19T10:30:00.000Z",
      "runtime": {
        "image": "ghcr.io/example/inventory@sha256:abc123",
        "repository": "ghcr.io/example/inventory",
        "tag": "1.2.0",
        "digest": "sha256:abc123"
      }
    }
  ]
}
```

## Request Parameters

| Parameter | Type | Required | Description | 
|-----------|------|----------|-------------|
| `capability` | string | No | Filter services by capability (existing) |
| `boundedContext` | string | No | Filter services by bounded context (existing) |
| `limit` | integer | No | Maximum results per page (default: 50) |
| `offset` | integer | No | Starting position for pagination (default: 0) |

**Parameter Rules**:
- If no parameters provided → return ALL services
- If `capability` provided → filter by capability (existing behavior)
- If `boundedContext` provided → filter by bounded context (existing behavior)
- If both `capability` AND `boundedContext` provided → return 400 Bad Request
- Pagination parameters (`limit`, `offset`) work with any filter combination

## Response Format

### Success Response (200 OK)

```json
{
  "total": number,        // Total count of services matching criteria
  "limit": number,        // Maximum results per page 
  "offset": number,       // Current page offset
  "results": ServiceInfo[] // Array of service information
}
```

### ServiceInfo Schema

```json
{
  "id": "string",                    // Service identifier (kebab-case)
  "name": "string",                  // Human-readable service name
  "version": "string",               // Semantic version (e.g., "1.2.0")  
  "description": "string",           // Service description
  "boundedContext": "string",        // Domain boundary identifier
  "capabilities": ["string"],        // Array of capability identifiers
  "publishedAt": "string",           // ISO 8601 timestamp (optional)
  "runtime": {                       // Runtime deployment info (optional)
    "image": "string",               // Full OCI reference with digest
    "repository": "string",          // Image repository
    "tag": "string",                 // Image tag  
    "digest": "string"               // SHA256 digest
  }
}
```

## Error Responses

### 400 Bad Request - Invalid Parameters

**Scenario**: Both capability and boundedContext provided, or empty parameter values

```json
{
  "error": "BadRequest",
  "message": "Either capability or boundedContext query parameter is required, not both",
  "timestamp": "2025-12-19T14:30:00.000Z"
}
```

### 500 Internal Server Error - System Failure

**Scenario**: Database error, service unavailable

```json
{
  "error": "InternalServerError", 
  "message": "Search operation failed",
  "timestamp": "2025-12-19T14:30:00.000Z"
}
```

## Behavior Changes

### NEW: Unfiltered Requests
- `GET /services` (no query params) → returns ALL services
- Maintains same response structure as filtered requests
- Uses same pagination patterns

### FIXED: Schema Version
- All ServiceInfo objects now have implicit `schemaVersion: "runtime-metadata-v1"`
- Fixes bug where services showed `"design-time-metadata-v1"`
- Applied consistently across filtered and unfiltered responses

### UNCHANGED: Existing Patterns
- Filtered requests work exactly as before
- Error handling patterns maintained  
- Pagination behavior unchanged
- Response structure identical

## Backwards Compatibility

✅ **Full backwards compatibility maintained**

- Existing clients using filtered endpoints see no changes
- New unfiltered capability available without affecting existing usage
- Response structure identical across all request types
- Error responses follow established patterns