# Subscription Service (Stub)

B2B domain-specific recurring order mock service.

## Purpose

Simulates subscription management and recurring billing for the B2B domain. This is a **stub service** (not SPAS-compliant) demonstrating domain-specific downstream consumers.

## Endpoints

### Events (Inbound)
- `POST /incoming` - Receive events from sidecar
  - OrderCreated - Triggers subscription activation

### Queries
- `GET /subscriptions` - List all subscriptions
- `GET /subscriptions/{id}` - Get specific subscription

### Health
- `GET /health` - Health check

## Events Published

- `SubscriptionActivated` (`com.b2b.subscription.activated`)

## Events Subscribed

- `OrderCreated` (`com.ecommerce.order.created`)

## Configuration

Environment variables:
- `SERVICE_NAME=subscription-service`
- `SIDECAR_HOST=subscription-service-sidecar`
- `SIDECAR_PORT=7011`
- `PORT=8080`

## Event Flow

1. Receives `OrderCreated` event via `/incoming` (B2B domain only)
2. Creates subscription record with monthly recurring billing
3. Publishes `SubscriptionActivated` event via sidecar

## Subscription Details

Each subscription includes:
- Monthly recurring billing
- Next billing date (30 days from activation)
- Active status

## Build & Run

### Local Development
```bash
npm install
npm start
```

### Docker
```bash
docker build -t subscription-service:1.0.0 .
docker run -p 8080:8080 subscription-service:1.0.0
```

## NOT SPAS-Compliant

This is a domain-specific stub service. It does NOT use the SPAS SDK and does NOT publish metadata to the Repository.
