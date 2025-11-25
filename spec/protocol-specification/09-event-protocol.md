# Event Protocol

## Envelope

- Required headers: `event-id`, `event-type`, `event-version`, `timestamp`, `correlation-id`, `trace-id`
- Optional headers: `causation-id`, `source-service`, `domainContext`

## Payload Schema

- JSON Schema or Protobuf
- Versioned using semver
- Additive-only changes for backward compatibility

## Event Types

- Domain events: business facts (past tense)
- Technical events: operational/system notifications

## Topics & Routing

- Topic naming: `{domainContext}.{boundedContext}.{eventType}.{version}`
- Routing rules defined in `choreography.yaml`

## Delivery Semantics

- At-least-once delivery
- Consumers ensure idempotency; event-id MAY be used as a key

## Filtering

- Sidecar/mesh MAY support event attribute-based filtering
