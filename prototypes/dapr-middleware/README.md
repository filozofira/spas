# DAPR Middleware Transformation Prototype

## Purpose

This prototype validates that DAPR HTTP Middleware can intercept and transform event payloads both **inbound** (after subscription routing, before service receives) and **outbound** (before dispatch to pub/sub topic).

This is a **critical architecture validation** for the SPAS PoC. If middleware cannot reliably intercept post-routing, we must pivot to an alternative pattern (e.g., sidecar adapter container).

## Architecture

```
Publisher (not in scope)
        ↓
    [DAPR Sidecar]
        ↓
[Custom HTTP Middleware] ← Intercepts & transforms payloads
        ↓
    [SPAS App]
        ↓
[Custom HTTP Middleware] ← Intercepts outbound publishes
        ↓
    [DAPR Sidecar]
        ↓
    Redis Pub/Sub
```

## Components

### 1. **Middleware** (`middleware.go`)
- Listens on `:8080`
- Intercepts all HTTP requests before they reach the app
- **Inbound**: Adds `transformed_inbound: true` to payload
- **Outbound**: Adds `transformed_outbound: true` to publish requests
- Forwards to actual app on `:8081`

### 2. **App** (`app.go`)
- Listens on `:8081`
- Exposes `/inbound` endpoint (receives transformed events from middleware)
- Exposes `/publish` endpoint (would call DAPR pub/sub)
- Exposes `/stats` endpoint (returns received messages for verification)

### 3. **Test** (`test.go`)
- Sends test events through middleware to app
- Verifies transformation markers exist in received payloads
- Reports success/failure of each transformation phase

## Running the Prototype

### Prerequisites
- Docker & Docker Compose
- DAPR CLI (optional, for manual testing)

### Quick Start

```powershell
cd c:\Source\Kingcon\spas\prototypes\dapr-middleware

# Build and start all services
docker-compose up --build

# In another terminal, run the test
go run test.go
```

### Expected Output

```
=== DAPR Middleware Transformation Test ===

[TEST 1] Inbound Event Transformation
Sending event through middleware to app...
Inbound response status: 200

[TEST 2] Verifying Inbound Transformation
Fetching stats from app...
✓ SUCCESS: Inbound transformation confirmed!
  Received payload with transformed_inbound=true
  Full payload: map[amount:99.99 eventType:order.created orderId:12345 transformed_inbound:true middleware_timestamp:2025-12-08T00:00:00Z]

[TEST 3] Outbound Publish Transformation
Sending publish request through middleware...
✓ Publish response status: 200

=== Test Summary ===
If both inbound and outbound transformations occurred, middleware works as expected.
```

## Success Criteria

✓ **PASS** if:
1. Middleware receives inbound event from DAPR subscription
2. Middleware adds `transformed_inbound: true` to payload
3. App receives modified payload with transformation marker
4. Middleware receives outbound publish request from app
5. Middleware adds `transformed_outbound: true` to payload
6. DAPR receives modified payload

✗ **FAIL** if:
1. Middleware cannot intercept post-routing (middleware runs before subscription dispatch)
2. Middleware cannot modify request bodies
3. App receives unmodified payload
4. Middleware causes request failures or data corruption

## Failure Plan

If this prototype fails (middleware cannot reliably intercept and transform), we must pivot to:

### Alternative 1: Sidecar Adapter Container Pattern
- Run a separate container between DAPR and app
- DAPR publishes to adapter HTTP endpoint
- Adapter transforms and forwards to app
- App publishes to adapter
- Adapter transforms and forwards to DAPR publish API

### Alternative 2: SDK-Level Transformation Wrapper
- Move transformation logic into SPAS SDK
- SDK wraps app's inbound/outbound message handling
- No middleware dependency
- Simpler but less reusable across frameworks

## Testing Locally (Without Docker)

```powershell
# Terminal 1: Start the app
go run app.go

# Terminal 2: Start the middleware
go run middleware.go

# Terminal 3: Run the test
go run test.go
```

## Decision Log

- **Language**: Go (DAPR ecosystem alignment)
- **Transport**: HTTP (PoC simplicity)
- **Middleware Pattern**: ReverseProxy + custom interceptor
- **Test Framework**: Native Go http package (no external dependencies)

## Next Steps

Once this prototype succeeds:
1. Integrate with actual DAPR pub/sub (Redis)
2. Create example choreography transformation file
3. Move transformation logic into CLI generation (spas-compose choreography generate)
4. Begin monorepo initialization (SDK, Repository, CLI)

---

**Status**: In Progress (Dec 8, 2025)  
**Owner**: [TBD]
